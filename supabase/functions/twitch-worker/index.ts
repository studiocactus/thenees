import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";
import { getTwitchToken, renderTemplate } from "../_shared/twitch.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const secret = request.headers.get("x-worker-secret");
  const adminUser = secret === Deno.env.get("BOT_WORKER_SECRET") ? {role:"worker"} : await requireAdmin(request);
  if (!adminUser) return json({error:"unauthorized"},401);
  const supabase=serviceClient();
  const token=await getTwitchToken();
  const {data:integration,error:integrationError}=await supabase.from("platform_integrations").select("external_user_id,bot_user_id").eq("platform","TWITCH").single();
  if(integrationError||!integration?.external_user_id)return json({error:"twitch_channel_not_configured"},503);
  const broadcasterId=String(integration.external_user_id);
  const botUserId=String(integration.bot_user_id??token.external_user_id);
  const clientId=Deno.env.get("TWITCH_CLIENT_ID")??"";
  if(!clientId)return json({error:"twitch_client_id_missing"},503);
  if(botUserId!==String(token.external_user_id))return json({error:"twitch_bot_token_identity_mismatch"},409);
  const {data:settings}=await supabase.from("site_settings").select("value").eq("key","official_links").maybeSingle();
  const communityUrl=((settings?.value as Record<string,string>|null)?.community??"https://thenees.com.br/#comunidade").replace(/theneees\.com\.br/gi,"thenees.com.br");
  const {data:items,error}=await supabase.from("bot_outbox").select("*").in("target_platform",["TWITCH","BOTH"]).in("status",["pending","failed"]).lte("available_at",new Date().toISOString()).order("created_at").limit(20);
  if(error)return json({error:error.message},500);
  const results=[];
  for(const item of items??[]){
    const payloadPlatform=String((item.payload as Record<string,unknown>)?.platform??"");
    const platformEvent=["command_response","moderator_feedback","first_chat_message","special_viewer_message","follow_received","sub_received","bits_received"].includes(item.event_key);
    const belongsElsewhere=Boolean(payloadPlatform)&&payloadPlatform!=="TWITCH";
    const legacyPlatformEvent=platformEvent&&!payloadPlatform;
    if(item.target_platform==="BOTH"&&(belongsElsewhere||legacyPlatformEvent))continue;
    const {data:delivered}=await supabase.from("bot_delivery_logs").select("id").eq("outbox_id",item.id).eq("platform","TWITCH").eq("status","sent").maybeSingle();
    if(delivered)continue;
    await supabase.from("bot_outbox").update({status:"processing",attempts:item.attempts+1}).eq("id",item.id);
    const message=renderTemplate(item.rendered_message??"{{message}}",item.payload as Record<string,unknown>,communityUrl);
    try{
      // A user access token makes ArrobaSrv speak as its own account. Twitch's
      // chatbot badge is reserved for the app-token + user:bot/channel:bot flow.
      const response=await fetch("https://api.twitch.tv/helix/chat/messages",{method:"POST",headers:{Authorization:`Bearer ${token.access_token}`,"Client-Id":clientId,"Content-Type":"application/json"},body:JSON.stringify({broadcaster_id:broadcasterId,sender_id:botUserId,message,for_source_only:true})});
      if(!response.ok)throw new Error(`twitch_${response.status}:${await response.text()}`);
      const outcome=(await response.json()).data?.[0];
      if(!outcome?.is_sent)throw new Error(outcome?.drop_reason?.message??"message_not_sent");
      await supabase.from("bot_delivery_logs").insert({outbox_id:item.id,platform:"TWITCH",status:"sent",external_message_id:outcome.message_id});
      const finalStatus=item.target_platform==="TWITCH"?"sent":"pending";
      await supabase.from("bot_outbox").update({status:finalStatus,processed_at:finalStatus==="sent"?new Date().toISOString():null,last_error:null,available_at:new Date(Date.now()+60000).toISOString()}).eq("id",item.id);
      results.push({id:item.id,status:"sent"});
    }catch(error){
      const messageError=String(error).slice(0,1000);
      await supabase.from("bot_delivery_logs").insert({outbox_id:item.id,platform:"TWITCH",status:"failed",error_message:messageError});
      await supabase.from("bot_outbox").update({status:"failed",last_error:messageError,available_at:new Date(Date.now()+Math.min(3600,2**(item.attempts+1)*30)*1000).toISOString()}).eq("id",item.id);
      results.push({id:item.id,status:"failed"});
    }
  }
  return json({processed:results.length,results});
});
