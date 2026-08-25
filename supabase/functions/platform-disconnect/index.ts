import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(request);
  if (!admin || !["owner","admin"].includes(admin.role)) return json({error:"unauthorized"},401);
  const { platform } = await request.json();
  if (!['TWITCH','KICK'].includes(platform)) return json({error:"invalid_platform"},400);
  const supabase=serviceClient();
  const cleanup:{removed:number;errors:string[]}={removed:0,errors:[]};
  if(platform==="TWITCH"){
    const {data:tokens}=await supabase.rpc("get_platform_token",{p_platform:"TWITCH"});
    const oldUserId=String(tokens?.[0]?.external_user_id??"");
    const {data:integration}=await supabase.from("platform_integrations").select("external_user_id,bot_user_id").eq("platform","TWITCH").maybeSingle();
    const relatedUserIds=[oldUserId,String(integration?.external_user_id??""),String(integration?.bot_user_id??"")].filter(Boolean);
    const clientId=Deno.env.get("TWITCH_CLIENT_ID")??"";
    const clientSecret=Deno.env.get("TWITCH_CLIENT_SECRET")??"";
    if(oldUserId&&clientId&&clientSecret){
      try{
        const appTokenResponse=await fetch("https://id.twitch.tv/oauth2/token",{method:"POST",body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:"client_credentials"})});
        if(!appTokenResponse.ok)throw new Error(`app_token_${appTokenResponse.status}`);
        const appToken=String((await appTokenResponse.json()).access_token);
        const headers={Authorization:`Bearer ${appToken}`,"Client-Id":clientId};
        let cursor="";
        do{
          const listUrl=new URL("https://api.twitch.tv/helix/eventsub/subscriptions");
          if(cursor)listUrl.searchParams.set("after",cursor);
          const listResponse=await fetch(listUrl,{headers});
          if(!listResponse.ok)throw new Error(`list_${listResponse.status}`);
          const list=await listResponse.json();
          for(const subscription of list.data??[]){
            const conditionValues=Object.values(subscription.condition??{}).map(String);
            if(!conditionValues.some((value)=>relatedUserIds.includes(value)))continue;
            const deleteResponse=await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${encodeURIComponent(subscription.id)}`,{method:"DELETE",headers});
            if(deleteResponse.ok||deleteResponse.status===404)cleanup.removed+=1;else cleanup.errors.push(`${subscription.id}:${deleteResponse.status}`);
          }
          cursor=String(list.pagination?.cursor??"");
        }while(cursor);
        await supabase.from("twitch_eventsub_subscriptions").delete().neq("id","");
      }catch(error){cleanup.errors.push(error instanceof Error?error.message:String(error));}
    }
  }
  if(cleanup.errors.length)return json({error:"remote_cleanup_failed",cleanup},502);
  const { error } = await supabase.rpc("disconnect_platform",{p_platform:platform});
  return error ? json({error:error.message},500) : json({ok:true,cleanup});
});
