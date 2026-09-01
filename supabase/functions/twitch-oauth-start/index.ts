import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";
import { twitchScopes } from "../_shared/twitch.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const admin = await requireAdmin(request);
  if (!admin || !["owner", "admin"].includes(admin.role)) return json({ error: "unauthorized" }, 401);
  const clientId = Deno.env.get("TWITCH_CLIENT_ID");
  const redirectUri = Deno.env.get("TWITCH_REDIRECT_URI");
  if (!clientId || !redirectUri) return json({ error: "twitch_secrets_missing" }, 503);
  const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const supabase = serviceClient();
  const { error } = await supabase.rpc("create_oauth_state", { p_platform: "TWITCH", p_state: state, p_redirect_uri: redirectUri });
  if (error) return json({ error: error.message }, 500);
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", twitchScopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("force_verify", "true");
  return json({ url: url.toString() });
});
