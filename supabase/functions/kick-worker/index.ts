import { corsHeaders, json } from "../_shared/cors.ts";
import { getKickToken, kickFetch } from "../_shared/kick.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";
import { renderTemplate } from "../_shared/twitch.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  const secret = request.headers.get("x-worker-secret");
  const admin = secret === Deno.env.get("BOT_WORKER_SECRET") ? {role:"worker"} : await requireAdmin(request);
  if (!admin) return json({error:"unauthorized"},401);
  const supabase=serviceClient();
  const token=await getKickToken();
  const {data:items,error}=await supabase.from("bot_outbox").select("*").in("target_platform",["KICK","BOTH"]).in("status",["pending","failed"]).lte("available_at",new Date().toISOString()).order("created_at").limit(20);
  if(error)return json({error:error.message},500);
  const results=[];
  for(const item of items??[]){
    const payloadPlatform=String((item.payload as Record<string,unknown>)?.platform??"");
    const platformEvent=["command_response","moderator_feedback","first_chat_message","special_viewer_message","follow_received","sub_received","bits_received"].includes(item.event_key);
    const belongsElsewhere=Boolean(payloadPlatform)&&payloadPlatform!=="KICK";
    const legacyPlatformEvent=platformEvent&&!payloadPlatform;
    if(item.target_platform==="BOTH"&&(belongsElsewhere||legacyPlatformEvent))continue;
    const {data:delivered}=await supabase.from("bot_delivery_logs").select("id").eq("outbox_id",item.id).eq("platform","KICK").eq("status","sent").maybeSingle();
    if(delivered)continue;
    await supabase.from("bot_outbox").update({status:"processing",attempts:item.attempts+1}).eq("id",item.id);
    const message=renderTemplate(item.rendered_message??"{{message}}",item.payload as Record<string,unknown>);
    try{
      const response=await kickFetch("/public/v1/chat",{method:"POST",body:JSON.stringify({broadcaster_user_id:Number(token.external_user_id),content:message,type:"user"})});
      const outcome=await response.json();
      const messageId=outcome.data?.message_id??outcome.data?.id??null;
      await supabase.from("bot_delivery_logs").insert({outbox_id:item.id,platform:"KICK",status:"sent",external_message_id:messageId});
      await supabase.from("bot_outbox").update({status:"sent",processed_at:new Date().toISOString(),last_error:null}).eq("id",item.id);
      results.push({id:item.id,status:"sent"});
    }catch(error){
      const reason=String(error).slice(0,1000);
      await supabase.from("bot_delivery_logs").insert({outbox_id:item.id,platform:"KICK",status:"failed",error_message:reason});
      await supabase.from("bot_outbox").update({status:"failed",last_error:reason,available_at:new Date(Date.now()+60000).toISOString()}).eq("id",item.id);
      results.push({id:item.id,status:"failed"});
    }
  }
  return json({processed:results.length,results});
});
