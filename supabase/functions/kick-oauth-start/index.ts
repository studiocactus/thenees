import { corsHeaders, json } from "../_shared/cors.ts";
import { kickScopes } from "../_shared/kick.ts";
import { requireAdmin, serviceClient } from "../_shared/supabase.ts";

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(request);
  if (!admin || !["owner", "admin"].includes(admin.role)) return json({ error: "unauthorized" }, 401);
  const clientId = Deno.env.get("KICK_CLIENT_ID");
  const redirectUri = Deno.env.get("KICK_REDIRECT_URI");
  if (!clientId || !redirectUri) return json({ error: "kick_secrets_missing" }, 503);

  const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(64)));
  const challenge = base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const { error } = await serviceClient().rpc("create_oauth_state_pkce", { p_platform:"KICK",p_state:state,p_redirect_uri:redirectUri,p_code_verifier:verifier });
  if (error) return json({ error: error.message }, 500);

  const url = new URL("https://id.kick.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", kickScopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return json({ url: url.toString() });
});
