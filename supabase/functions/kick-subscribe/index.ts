import { corsHeaders, json } from "../_shared/cors.ts";
import { kickAppFetch, kickChannelUserId } from "../_shared/kick.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";

const events = [
  "chat.message.sent",
  "channel.followed",
  "channel.subscription.new",
  "channel.subscription.renewal",
  "channel.subscription.gifts",
].map((name) => ({ name, version: 1 }));

Deno.serve(async (request) => {
  try {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    const admin = await requireAdmin(request);
    if (!admin || !["owner", "admin"].includes(admin.role)) return json({ error:"unauthorized" }, 401);
    // Kick can keep subscriptions marked as active even when deliveries have
    // silently stopped. Reconcile against the remote API instead of trusting
    // the local rows: remove the current token's subscriptions and recreate
    // the complete desired set.
    const currentResponse = await kickAppFetch(`/public/v1/events/subscriptions?broadcaster_user_id=${encodeURIComponent(kickChannelUserId)}`);
    const currentPayload = await currentResponse.json();
    const current = Array.isArray(currentPayload.data) ? currentPayload.data : [];
    const currentIds = current
      .map((item: Record<string, unknown>) => String(item.id ?? ""))
      .filter(Boolean);

    if (currentIds.length) {
      const query = new URLSearchParams();
      for (const id of currentIds) query.append("id", id);
      await kickAppFetch(`/public/v1/events/subscriptions?${query.toString()}`, { method: "DELETE" });
    }

    await serviceClient().from("kick_event_subscriptions").delete().neq("id", "");

    const response = await kickAppFetch("/public/v1/events/subscriptions", { method:"POST",body:JSON.stringify({ broadcaster_user_id:Number(kickChannelUserId),events,method:"webhook" }) });
    const payload = await response.json();
    const results = Array.isArray(payload.data) ? payload.data : [];
    for (const item of results) {
      if (!item.subscription_id) continue;
      await serviceClient().from("kick_event_subscriptions").upsert({
        id:item.subscription_id,subscription_type:item.name,version:item.version??1,
        status:item.error?"error":"enabled",error:item.error??null,updated_at:new Date().toISOString(),
      });
    }
    const verifyResponse = await kickAppFetch(`/public/v1/events/subscriptions?broadcaster_user_id=${encodeURIComponent(kickChannelUserId)}`);
    const verifyPayload = await verifyResponse.json();
    const remote = Array.isArray(verifyPayload.data) ? verifyPayload.data : [];
    const enabledEvents = new Set(remote.map((item: Record<string, unknown>) => String(item.event ?? "")));
    const missing = events.map((item) => item.name).filter((name) => !enabledEvents.has(name));
    const failures = results.filter((item:Record<string,unknown>)=>item.error);
    if (missing.length) failures.push({ error: "subscriptions_missing_after_reconcile", events: missing });
    await serviceClient().from("platform_integrations").update({
      eventsub_status:failures.length?"error":"active",
      last_error:failures.length?JSON.stringify(failures).slice(0,1800):null,
      last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString(),
    }).eq("platform","KICK");
    return json({ removed: currentIds.length, results, remote, missing });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await serviceClient().from("platform_integrations").update({eventsub_status:"error",last_error:message,updated_at:new Date().toISOString()}).eq("platform","KICK");
    return json({ error:message }, 500);
  }
});
