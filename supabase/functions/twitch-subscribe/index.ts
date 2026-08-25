import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";
import { getTwitchToken } from "../_shared/twitch.ts";

const definitions = [
  ["stream.online","1","broadcaster"], ["stream.offline","1","broadcaster"],
  ["channel.follow","2","moderator"], ["channel.subscribe","1","broadcaster"],
  ["channel.subscription.message","1","broadcaster"], ["channel.cheer","1","broadcaster"],
  ["channel.chat.message","1","user"],
] as const;

Deno.serve(async (request) => {
 try {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const adminUser = await requireAdmin(request);
  if (!adminUser || !["owner","admin"].includes(adminUser.role)) return json({error:"unauthorized"},401);
  const callback = Deno.env.get("TWITCH_EVENTSUB_CALLBACK");
  const secret = Deno.env.get("TWITCH_EVENTSUB_SECRET");
  if (!callback || !secret) return json({error:"eventsub_secrets_missing"},503);
  const token = await getTwitchToken();
  const {data:integration,error:integrationError}=await serviceClient().from("platform_integrations").select("external_user_id,bot_user_id").eq("platform","TWITCH").single();
  if(integrationError||!integration?.external_user_id)throw new Error("twitch_channel_not_configured");
  const broadcasterId=String(integration.external_user_id);
  const botUserId=String(integration.bot_user_id??token.external_user_id);
  const clientId = Deno.env.get("TWITCH_CLIENT_ID")!;
  const clientSecret = Deno.env.get("TWITCH_CLIENT_SECRET")!;
  const appTokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
    method:"POST",
    body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:"client_credentials"}),
  });
  if (!appTokenResponse.ok) throw new Error(`twitch_app_token_${appTokenResponse.status}`);
  const appToken = (await appTokenResponse.json()).access_token as string;
  const twitchHeaders={"Authorization":`Bearer ${appToken}`,"Client-Id":clientId,"Content-Type":"application/json"};
  const desiredConditions=new Map<string,Record<string,string>>(definitions.map(([type,version,conditionMode])=>{
    const condition:Record<string,string>={broadcaster_user_id:broadcasterId};
    if(conditionMode==="moderator")condition.moderator_user_id=botUserId;
    if(conditionMode==="user")condition.user_id=botUserId;
    return [`${type}:${version}`,condition] as const;
  }));
  const remoteSubscriptions:Record<string,unknown>[]=[];
  let listCursor="";
  do{
    const listUrl=new URL("https://api.twitch.tv/helix/eventsub/subscriptions");
    if(listCursor)listUrl.searchParams.set("after",listCursor);
    const response=await fetch(listUrl,{headers:twitchHeaders});
    if(!response.ok)throw new Error(`twitch_list_${response.status}:${await response.text()}`);
    const body=await response.json();
    remoteSubscriptions.push(...(body.data??[]));
    listCursor=String(body.pagination?.cursor??"");
  }while(listCursor);
  const retained=new Set<string>();
  for(const subscription of remoteSubscriptions){
    const type=String(subscription.type??"");
    const version=String(subscription.version??"");
    const key=`${type}:${version}`;
    const desired=desiredConditions.get(key);
    if(!desired)continue;
    const condition=subscription.condition as Record<string,string>|undefined;
    const transport=subscription.transport as Record<string,unknown>|undefined;
    if(String(condition?.broadcaster_user_id??"")!==broadcasterId||String(transport?.callback??"")!==callback)continue;
    const exactCondition=Object.entries(desired).every(([name,value])=>String(condition?.[name]??"")===value)
      && Object.keys(condition??{}).length===Object.keys(desired).length;
    const enabled=String(subscription.status??"")==="enabled";
    if(exactCondition&&enabled&&!retained.has(key)){retained.add(key);continue;}
    const id=String(subscription.id??"");
    if(!id)continue;
    const deleteResponse=await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${encodeURIComponent(id)}`,{method:"DELETE",headers:twitchHeaders});
    if(deleteResponse.ok||deleteResponse.status===404)await serviceClient().from("twitch_eventsub_subscriptions").delete().eq("id",id);
  }
  const results=[];
  for (const [type,version,conditionMode] of definitions) {
    if(retained.has(`${type}:${version}`)){results.push({type,status:"enabled"});continue;}
    const condition:Record<string,string>={broadcaster_user_id:broadcasterId};
    if(conditionMode==="moderator")condition.moderator_user_id=botUserId;
    if(conditionMode==="user")condition.user_id=botUserId;
    try {
      const response=await fetch("https://api.twitch.tv/helix/eventsub/subscriptions",{method:"POST",headers:twitchHeaders,body:JSON.stringify({type,version,condition,transport:{method:"webhook",callback,secret}})});
      if(response.status===409){results.push({type,status:"exists"});continue;}
      if(!response.ok) throw new Error(`twitch_${response.status}:${await response.text()}`);
      const subscription=(await response.json()).data?.[0];
      if(subscription){await serviceClient().from("twitch_eventsub_subscriptions").upsert({id:subscription.id,subscription_type:subscription.type,version:subscription.version,status:subscription.status,cost:subscription.cost,condition:subscription.condition,created_at:subscription.created_at,updated_at:new Date().toISOString()});results.push({type,status:subscription.status});}
    } catch(error){results.push({type,status:"error",error:String(error)});}
  }
  const hasError=results.some((item)=>item.status==="error");
  const listResponse=await fetch("https://api.twitch.tv/helix/eventsub/subscriptions",{headers:twitchHeaders});
  const liveSubscriptions=listResponse.ok?((await listResponse.json()).data??[]).filter((item:Record<string,unknown>)=>(item.transport as Record<string,unknown>)?.callback===callback):[];
  for(const subscription of liveSubscriptions){await serviceClient().from("twitch_eventsub_subscriptions").upsert({id:subscription.id,subscription_type:subscription.type,version:subscription.version,status:subscription.status,cost:subscription.cost,condition:subscription.condition,created_at:subscription.created_at,updated_at:new Date().toISOString()});}
  const hasEnabled=liveSubscriptions.some((item:Record<string,unknown>)=>item.status==="enabled");
  const failureSummary=results.filter((item)=>item.status==="error").map((item)=>`${item.type}: ${item.error}`).join(" | ").slice(0,1800);
  await serviceClient().from("platform_integrations").update({eventsub_status:hasError?"error":hasEnabled?"active":"pending",last_error:hasError?failureSummary:null,updated_at:new Date().toISOString()}).eq("platform","TWITCH");
  return json({results});
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await serviceClient().from("platform_integrations").update({eventsub_status:"error",last_error:message,updated_at:new Date().toISOString()}).eq("platform","TWITCH");
  return json({error:message});
 }
});
