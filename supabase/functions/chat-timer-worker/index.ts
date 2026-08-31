import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  const secret=request.headers.get("x-worker-secret");
  const cronSecret=request.headers.get("x-cron-secret");
  const serviceAuthorization=request.headers.get("Authorization")===`Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
  const internalRequest=secret===Deno.env.get("BOT_WORKER_SECRET")||cronSecret===Deno.env.get("CHAT_TIMER_CRON_SECRET")||serviceAuthorization;
  const actor=internalRequest?{role:"worker"}:await requireAdmin(request);
  if(!actor)return json({error:"unauthorized"},401);
  const supabase=serviceClient();
  const {data:queued,error}=await supabase.rpc("queue_due_chat_timers");
  if(error)return json({error:error.message},500);
  const {count:pendingCount,error:pendingError}=await supabase.from("bot_outbox")
    .select("id",{count:"exact",head:true})
    .eq("status","pending")
    .lte("available_at",new Date().toISOString());
  if(pendingError)return json({error:pendingError.message},500);
  const projectUrl=Deno.env.get("SUPABASE_URL");
  const workerSecret=Deno.env.get("BOT_WORKER_SECRET");
  if(projectUrl&&workerSecret&&Number(pendingCount??0)>0){
    await Promise.all([
      fetch(`${projectUrl}/functions/v1/twitch-worker`,{method:"POST",headers:{"x-worker-secret":workerSecret,"Content-Type":"application/json"},body:"{}"}),
      fetch(`${projectUrl}/functions/v1/kick-worker`,{method:"POST",headers:{"x-worker-secret":workerSecret,"Content-Type":"application/json"},body:"{}"}),
    ]);
  }
  return json({queued:Number(queued??0),pending:Number(pendingCount??0)});
});
