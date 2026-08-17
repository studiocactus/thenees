import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(request);
  if (!admin || !["owner","admin"].includes(admin.role)) return json({error:"unauthorized"},401);
  const { platform } = await request.json();
  if (!['TWITCH','KICK'].includes(platform)) return json({error:"invalid_platform"},400);
  const { error } = await serviceClient().rpc("disconnect_platform",{p_platform:platform});
  return error ? json({error:error.message},500) : json({ok:true});
});
