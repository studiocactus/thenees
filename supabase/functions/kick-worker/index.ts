import { corsHeaders, json } from "../_shared/cors.ts";
import { getKickToken, kickFetch } from "../_shared/kick.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";
import { renderTemplate } from "../_shared/twitch.ts";
import { MAX_DELIVERY_ATTEMPTS, isTransientDeliveryError, retryDelaySeconds } from "../_shared/outboxRetry.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  const secret = request.headers.get("x-worker-secret");
  const workerSecret=Deno.env.get("BOT_WORKER_SECRET");
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const serviceAuthorization=Boolean(serviceKey)&&request.headers.get("Authorization")===`Bearer ${serviceKey}`;
  const admin = Boolean(workerSecret)&&secret === workerSecret || serviceAuthorization ? {role:"worker"} : await requireAdmin(request);
  if (!admin) return json({error:"unauthorized"},401);
  const supabase=serviceClient();
  await supabase.rpc("recover_stale_bot_outbox");
  const token=await getKickToken();
  const {data:integration,error:integrationError}=await supabase.from("platform_integrations").select("external_user_id").eq("platform","KICK").single();
  if(integrationError||!integration?.external_user_id)return json({error:"kick_channel_not_configured"},503);
  const broadcasterUserId=Number(integration.external_user_id);
  // Webhooks are real-time: deliver only the newest fresh Kick item. This keeps
  // an old backlog (or previously failed records) from flooding the live chat.
  const now=new Date().toISOString();
  const freshSince=new Date(Date.now()-2*60*1000).toISOString();
  const {data:commandItems,error:commandError}=await supabase.from("bot_outbox").select("*").in("target_platform",["KICK","BOTH"]).in("event_key",["command_response","moderator_feedback"]).eq("status","pending").or(`created_at.gte.${freshSince},attempts.gt.0`).lte("available_at",now).order("created_at",{ascending:false}).limit(10);
  if(commandError)return json({error:commandError.message},500);
  const forKick=(items:Record<string,unknown>[]|null|undefined)=>(items??[]).filter((item)=>{
    const payloadPlatform=String((item.payload as Record<string,unknown>)?.platform??"");
    return item.target_platform!=="BOTH"||!payloadPlatform||payloadPlatform==="KICK";
  });
  const matchingCommandItems=forKick(commandItems);
  const {data:timerItems,error:timerError}=matchingCommandItems.length?{data:[],error:null}:await supabase.from("bot_outbox").select("*").in("target_platform",["KICK","BOTH"]).eq("event_key","chat_timer").eq("status","pending").lte("available_at",now).order("created_at").limit(10);
  if(timerError)return json({error:timerError.message},500);
  // Outbound policy: Kick accepts configured timers, explicit !commands,
  // configured welcomes and recognized platform events.
  const allowedAutomaticEvents=["special_viewer_message","follow_received","sub_received","sub_message_received","bits_received","raid_received","birthday_today","live_started","quote_published","chatbattle_event","player_registered","first_chat_message"];
  const matchingTimerItems=forKick(timerItems);
  const {data:eventItems,error:eventError}=matchingCommandItems.length||matchingTimerItems.length?{data:[],error:null}:await supabase.from("bot_outbox").select("*").in("target_platform",["KICK","BOTH"]).in("event_key",allowedAutomaticEvents).eq("status","pending").or(`created_at.gte.${freshSince},attempts.gt.0`).lte("available_at",now).order("created_at",{ascending:false}).limit(10);
  if(eventError)return json({error:eventError.message},500);
  const matchingEventItems=forKick(eventItems);
  const items=(matchingCommandItems.length?matchingCommandItems:matchingTimerItems.length?matchingTimerItems:matchingEventItems).slice(0,1);
  const results=[];
  for(const candidate of items??[]){
    const {data:item,error:claimError}=await supabase.from("bot_outbox")
      .update({status:"processing",attempts:Number(candidate.attempts??0)+1,available_at:new Date(Date.now()+2*60*1000).toISOString()})
      .eq("id",candidate.id).eq("status","pending")
      .select("*").maybeSingle();
    if(claimError)return json({error:claimError.message},500);
    if(!item)continue;
    const itemPayload=item.payload as Record<string,unknown>;
    const isTimer=item.event_key==="chat_timer";
    const isRequestedCommand=["command_response","moderator_feedback"].includes(item.event_key)
      && String(itemPayload?.command??"").startsWith("!")
      && Boolean(String(itemPayload?.source_message_id??"").trim());
    const isConfiguredWelcome=item.event_key==="special_viewer_message"&&Boolean(String(itemPayload?.source_message_id??"").trim());
    const isPlatformEvent=allowedAutomaticEvents.includes(item.event_key);
    let commandSourceMatches=true;
    if(isRequestedCommand){
      const sourceMessageId=String(itemPayload.source_message_id);
      const {data:sourceEvent}=await supabase.from("platform_events").select("payload").eq("platform","KICK").eq("event_type","chat.message.sent").eq("external_event_id",sourceMessageId).maybeSingle();
      const sourcePayload=sourceEvent?.payload as Record<string,unknown>|undefined;
      const nestedMessage=sourcePayload?.message as Record<string,unknown>|string|undefined;
      const sourceText=String(sourcePayload?.content??(typeof nestedMessage==="object"?nestedMessage?.text:nestedMessage)??"");
      const requestedCommand=sourceText.trim().split(/\s+/)[0]?.toLowerCase();
      commandSourceMatches=item.target_platform==="KICK"
        && String(itemPayload.platform??"")==="KICK"
        && requestedCommand===String(itemPayload.command).toLowerCase();
    }
    if(!isTimer&&!isRequestedCommand&&!isConfiguredWelcome&&!isPlatformEvent||!commandSourceMatches){
      await supabase.from("bot_outbox").update({status:"failed",processed_at:new Date().toISOString(),last_error:commandSourceMatches?"blocked_unsolicited_chat_message":"blocked_command_source_mismatch"}).eq("id",item.id);
      results.push({id:item.id,status:"blocked"});
      continue;
    }
    const payloadPlatform=String(itemPayload?.platform??"");
    const requiresBoth=item.target_platform==="BOTH"&&!payloadPlatform;
    const belongsElsewhere=Boolean(payloadPlatform)&&payloadPlatform!=="KICK";
    if(item.target_platform==="BOTH"&&belongsElsewhere){
      await supabase.from("bot_outbox").update({status:"failed",processed_at:new Date().toISOString(),last_error:"blocked_ambiguous_platform_target"}).eq("id",item.id);
      results.push({id:item.id,status:"blocked"});
      continue;
    }
    const {data:delivered}=await supabase.from("bot_delivery_logs").select("id").eq("outbox_id",item.id).eq("platform","KICK").eq("status","sent").maybeSingle();
    if(delivered){
      const {data:otherDelivery}=requiresBoth?await supabase.from("bot_delivery_logs").select("id").eq("outbox_id",item.id).eq("platform","TWITCH").eq("status","sent").maybeSingle():{data:true};
      await supabase.from("bot_outbox").update({status:otherDelivery?"sent":"pending",processed_at:otherDelivery?new Date().toISOString():null,last_error:null,available_at:new Date(Date.now()+1000).toISOString()}).eq("id",item.id);
      continue;
    }
    const renderPayload={...(item.payload as Record<string,unknown>),platform:itemPayload.platform??"KICK"};
    const message=renderTemplate(isRequestedCommand?"{{message}}":item.rendered_message??"{{message}}",renderPayload);
    try{
      const response=await kickFetch("/public/v1/chat",{method:"POST",body:JSON.stringify({broadcaster_user_id:broadcasterUserId,content:message,type:"user"})});
      const outcome=await response.json();
      if(outcome.data?.is_sent!==true)throw new Error(`kick_message_not_sent:${JSON.stringify(outcome).slice(0,700)}`);
      const messageId=outcome.data?.message_id??outcome.data?.id??null;
      await supabase.from("bot_delivery_logs").insert({outbox_id:item.id,platform:"KICK",status:"sent",external_message_id:messageId});
      const {data:otherDelivery}=requiresBoth?await supabase.from("bot_delivery_logs").select("id").eq("outbox_id",item.id).eq("platform","TWITCH").eq("status","sent").maybeSingle():{data:true};
      await supabase.from("bot_outbox").update({status:otherDelivery?"sent":"pending",processed_at:otherDelivery?new Date().toISOString():null,last_error:null,available_at:new Date(Date.now()+1000).toISOString()}).eq("id",item.id);
      await supabase.from("platform_integrations").update({status:"connected",last_error:null,last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("platform","KICK");
      results.push({id:item.id,status:"sent"});
    }catch(error){
      const reason=String(error).slice(0,1000);
      console.error("kick_delivery_failed",{outbox_id:item.id,error:reason});
      await supabase.from("bot_delivery_logs").insert({outbox_id:item.id,platform:"KICK",status:"failed",error_message:reason});
      const shouldRetry=isTransientDeliveryError(error)&&Number(item.attempts)<MAX_DELIVERY_ATTEMPTS;
      const retryAt=new Date(Date.now()+retryDelaySeconds(Number(item.attempts))*1000).toISOString();
      await supabase.from("bot_outbox").update({status:shouldRetry?"pending":"failed",processed_at:shouldRetry?null:new Date().toISOString(),last_error:reason,available_at:retryAt}).eq("id",item.id);
      if(!shouldRetry)await supabase.from("platform_integrations").update({status:"error",last_error:reason,last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("platform","KICK");
      results.push({id:item.id,status:shouldRetry?"retrying":"failed",attempts:item.attempts,available_at:shouldRetry?retryAt:null});
    }
  }
  return json({processed:results.length,results});
});
