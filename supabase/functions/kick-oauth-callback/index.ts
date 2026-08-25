import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const errorParam = requestUrl.searchParams.get("error");
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3001";
  if (errorParam || !code || !state) return Response.redirect(`${siteUrl}/control#kick-error`, 302);

  const supabase = serviceClient();
  const { data: states } = await supabase.rpc("consume_oauth_state_pkce", { p_platform:"KICK",p_state:state });
  const oauthState = states?.[0];
  if (!oauthState?.redirect_uri || !oauthState?.code_verifier) return Response.redirect(`${siteUrl}/control#kick-state-expired`, 302);

  const body = new URLSearchParams({
    client_id: Deno.env.get("KICK_CLIENT_ID")!,
    client_secret: Deno.env.get("KICK_CLIENT_SECRET")!,
    code,
    grant_type: "authorization_code",
    redirect_uri: oauthState.redirect_uri,
    code_verifier: oauthState.code_verifier,
  });
  const tokenResponse = await fetch("https://id.kick.com/oauth/token", { method: "POST", body });
  if (!tokenResponse.ok) return Response.redirect(`${siteUrl}/control#kick-token-error`, 302);
  const token = await tokenResponse.json();

  const userResponse = await fetch("https://api.kick.com/public/v1/users", { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!userResponse.ok) return Response.redirect(`${siteUrl}/control#kick-user-error`, 302);
  const user = (await userResponse.json()).data?.[0];
  const userId = user?.user_id ?? user?.id;
  const userLogin = user?.name ?? user?.username;
  if (!userId || !userLogin) return Response.redirect(`${siteUrl}/control#kick-user-error`, 302);
  const scopes = Array.isArray(token.scope) ? token.scope : String(token.scope ?? "").split(" ").filter(Boolean);

  await supabase.rpc("store_platform_token", { p_platform:"KICK",p_access_token:token.access_token,p_refresh_token:token.refresh_token,p_token_type:token.token_type??"bearer",p_scopes:scopes,p_expires_at:new Date(Date.now()+Number(token.expires_in)*1000).toISOString(),p_external_user_id:String(userId),p_external_login:String(userLogin) });
  await supabase.from("platform_integrations").upsert({ platform:"KICK",status:"connected",channel_login:String(userLogin),external_user_id:String(userId),display_name:String(userLogin),scopes,eventsub_status:"pending",last_synced_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString() });
  await supabase.from("bot_channels").update({ channel_name:String(userLogin),enabled:true,connection_status:"connected",last_connected_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString() }).eq("platform","KICK");
  return Response.redirect(`${siteUrl}/control#kick-connected`, 302);
});
