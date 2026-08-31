import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";
import { getTwitchToken, renderTemplate } from "../_shared/twitch.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const secret = request.headers.get("x-worker-secret");
  const adminUser = secret === Deno.env.get("BOT_WORKER_SECRET") ? {role:"worker"} : await requireAdmin(request);
  if (!adminUser) return json({error:"unauthorized"},401);
  const supabase=serviceClient();
  await supabase.rpc("recover_stale_bot_outbox");
  const token=await getTwitchToken();
  const {data:integration,error:integrationError}=await supabase.from("platform_integrations").select("external_user_id,bot_user_id").eq("platform","TWITCH").single();
  if(integrationError||!integration?.external_user_id)return json({error:"twitch_channel_not_configured"},503);
  const broadcasterId=String(integration.external_user_id);
  const botUserId=String(token.external_user_id);
  const clientId=Deno.env.get("TWITCH_CLIENT_ID")??"";
  if(!clientId)return json({error:"twitch_client_id_missing"},503);
  if(integration.bot_user_id&&String(integration.bot_user_id)!==botUserId)return json({error:"twitch_bot_token_identity_mismatch"},503);
  const {data:settings}=await supabase.from("site_settings").select("value").eq("key","official_links").maybeSingle();
  const communityUrl=((settings?.value as Record<string,string>|null)?.community??"https://thenees.com.br/#comunidade").replace(/theneees\.com\.br/gi,"thenees.com.br");
  // EventSub is real-time: prioritize one fresh response and never let an old
  // shared backlog block or flood Twitch chat.
  const now=new Date().toISOString();
  const freshSince=new Date(Date.now()-2*60*1000).toISOString();
  // Outbound policy: explicit !commands, configured timers and recognized
  // platform events may write to chat. Generic chat activity never may.
  const {data:commandItems,error:commandError}=await supabase.from("bot_outbox").select("*").in("target_platform",["TWITCH","BOTH"]).in("event_key",["command_response","moderator_feedback"]).eq("status","pending").gte("created_at",freshSince).lte("available_at",now).order("created_at",{ascending:false}).limit(10);
  if(commandError)return json({error:commandError.message},500);
  const forTwitch=(items:Record<string,unknown>[]|null|undefined)=>(items??[]).filter((item)=>{
    const payloadPlatform=String((item.payload as Record<string,unknown>)?.platform??"");
    return item.target_platform!=="BOTH"||!payloadPlatform||payloadPlatform==="TWITCH";
  });
  const matchingCommandItems=forTwitch(commandItems);
  const {data:timerItems,error:timerError}=matchingCommandItems.length?{data:[],error:null}:await supabase.from("bot_outbox").select("*").eq("target_platform","TWITCH").eq("event_key","chat_timer").eq("status","pending").lte("available_at",now).order("created_at").limit(10);
  if(timerError)return json({error:timerError.message},500);
  const allowedAutomaticEvents=["special_viewer_message","follow_received","sub_received","sub_message_received","bits_received","raid_received","birthday_today","live_started","quote_published","chatbattle_event","player_registered","first_chat_message"];
  const matchingTimerItems=forTwitch(timerItems);
  const {data:eventItems,error:eventError}=matchingCommandItems.length||matchingTimerItems.length?{data:[],error:null}:await supabase.from("bot_outbox").select("*").in("target_platform",["TWITCH","BOTH"]).in("event_key",allowedAutomaticEvents).eq("status","pending").gte("created_at",freshSince).lte("available_at",now).order("created_at",{ascending:false}).limit(10);
  if(eventError)return json({error:eventError.message},500);
  const matchingEventItems=forTwitch(eventItems);
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
      const {data:sourceEvent}=await supabase.from("platform_events").select("payload").eq("platform","TWITCH").eq("event_type","channel.chat.message").eq("payload->>message_id",sourceMessageId).maybeSingle();
      const sourcePayload=sourceEvent?.payload as Record<string,unknown>|undefined;
      const sourceMessage=sourcePayload?.message as Record<string,unknown>|undefined;
      const requestedCommand=String(sourceMessage?.text??"").trim().split(/\s+/)[0]?.toLowerCase();
      commandSourceMatches=item.target_platform==="TWITCH"
        && String(itemPayload.platform??"")==="TWITCH"
        && requestedCommand===String(itemPayload.command).toLowerCase();
    }
    if(!isTimer&&!isRequestedCommand&&!isConfiguredWelcome&&!isPlatformEvent||!commandSourceMatches){
      await supabase.from("bot_outbox").update({status:"failed",processed_at:new Date().toISOString(),last_error:commandSourceMatches?"blocked_unsolicited_chat_message":"blocked_command_source_mismatch"}).eq("id",item.id);
      results.push({id:item.id,status:"blocked"});
      continue;
    }
    const payloadPlatform=String(itemPayload?.platform??"");
    const requiresBoth=item.target_platform==="BOTH"&&!payloadPlatform;
    const belongsElsewhere=Boolean(payloadPlatform)&&payloadPlatform!=="TWITCH";
    if(item.target_platform==="BOTH"&&belongsElsewhere){
      await supabase.from("bot_outbox").update({status:"failed",processed_at:new Date().toISOString(),last_error:"blocked_ambiguous_platform_target"}).eq("id",item.id);
      results.push({id:item.id,status:"blocked"});
      continue;
    }
    const {data:delivered}=await supabase.from("bot_delivery_logs").select("id").eq("outbox_id",item.id).eq("platform","TWITCH").eq("status","sent").maybeSingle();
    if(delivered){
      const {data:otherDelivery}=requiresBoth?await supabase.from("bot_delivery_logs").select("id").eq("outbox_id",item.id).eq("platform","KICK").eq("status","sent").maybeSingle():{data:true};
      await supabase.from("bot_outbox").update({status:otherDelivery?"sent":"pending",processed_at:otherDelivery?new Date().toISOString():null,last_error:null,available_at:new Date(Date.now()+1000).toISOString()}).eq("id",item.id);
      continue;
    }
    const renderPayload={...(item.payload as Record<string,unknown>),platform:itemPayload.platform??"TWITCH"};
    const message=renderTemplate(isRequestedCommand?"{{message}}":item.rendered_message??"{{message}}",renderPayload,communityUrl);
    const deliveryMode=String((item.payload as Record<string,unknown>)?.delivery_mode??"message");
    const announcementColor=String((item.payload as Record<string,unknown>)?.announcement_color??"primary");
    try{
      const isAnnouncement=deliveryMode==="announcement";
      const endpoint=isAnnouncement?`https://api.twitch.tv/helix/chat/announcements?broadcaster_id=${encodeURIComponent(broadcasterId)}&moderator_id=${encodeURIComponent(botUserId)}`:"https://api.twitch.tv/helix/chat/messages";
      const body=isAnnouncement?{message,color:announcementColor}:{broadcaster_id:broadcasterId,sender_id:botUserId,message};
      const response=await fetch(endpoint,{method:"POST",headers:{Authorization:`Bearer ${token.access_token}`,"Client-Id":clientId,"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!response.ok)throw new Error(`twitch_${response.status}:${await response.text()}`);
      const outcome=isAnnouncement?null:(await response.json()).data?.[0];
      if(!isAnnouncement&&!outcome?.is_sent)throw new Error(outcome?.drop_reason?.message??"message_not_sent");
      await supabase.from("bot_delivery_logs").insert({outbox_id:item.id,platform:"TWITCH",status:"sent",external_message_id:outcome?.message_id??null});
      const {data:otherDelivery}=requiresBoth?await supabase.from("bot_delivery_logs").select("id").eq("outbox_id",item.id).eq("platform","KICK").eq("status","sent").maybeSingle():{data:true};
      await supabase.from("bot_outbox").update({status:otherDelivery?"sent":"pending",processed_at:otherDelivery?new Date().toISOString():null,last_error:null,available_at:new Date(Date.now()+1000).toISOString()}).eq("id",item.id);
      results.push({id:item.id,status:"sent"});
    }catch(error){
      const messageError=String(error).slice(0,1000);
      await supabase.from("bot_delivery_logs").insert({outbox_id:item.id,platform:"TWITCH",status:"failed",error_message:messageError});
      await supabase.from("bot_outbox").update({status:"failed",last_error:messageError,available_at:new Date(Date.now()+Math.min(3600,2**Number(item.attempts)*30)*1000).toISOString()}).eq("id",item.id);
      results.push({id:item.id,status:"failed"});
    }
  }
  return json({processed:results.length,results});
});
