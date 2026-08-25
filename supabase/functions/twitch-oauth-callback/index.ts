import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3001";
  if (errorParam || !code || !state) return Response.redirect(`${siteUrl}/control#twitch-error`, 302);
  const supabase = serviceClient();
  const { data: redirectUri } = await supabase.rpc("consume_oauth_state", { p_platform: "TWITCH", p_state: state });
  if (!redirectUri) return Response.redirect(`${siteUrl}/control#twitch-state-expired`, 302);
  const body = new URLSearchParams({ client_id: Deno.env.get("TWITCH_CLIENT_ID")!, client_secret: Deno.env.get("TWITCH_CLIENT_SECRET")!, code, grant_type: "authorization_code", redirect_uri: redirectUri });
  const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", body });
  if (!tokenResponse.ok) return Response.redirect(`${siteUrl}/control#twitch-token-error`, 302);
  const token = await tokenResponse.json();
  const userResponse = await fetch("https://api.twitch.tv/helix/users", { headers: { Authorization: `Bearer ${token.access_token}`, "Client-Id": Deno.env.get("TWITCH_CLIENT_ID")! } });
  const user = (await userResponse.json()).data?.[0];
  if (!user) return Response.redirect(`${siteUrl}/control#twitch-user-error`, 302);
  const expectedBotLogin = (Deno.env.get("TWITCH_BOT_LOGIN") ?? "arrobasrv").toLowerCase();
  const channelLogin = (Deno.env.get("TWITCH_CHANNEL_LOGIN") ?? "thenees").toLowerCase();
  if (String(user.login).toLowerCase() !== expectedBotLogin) {
    return Response.redirect(`${siteUrl}/control#twitch-wrong-account-${encodeURIComponent(user.login)}`, 302);
  }
  const channelResponse = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(channelLogin)}`, { headers: { Authorization: `Bearer ${token.access_token}`, "Client-Id": Deno.env.get("TWITCH_CLIENT_ID")! } });
  const channel = (await channelResponse.json()).data?.[0];
  if (!channel) return Response.redirect(`${siteUrl}/control#twitch-channel-error`, 302);
  await supabase.rpc("store_platform_token", { p_platform:"TWITCH",p_access_token:token.access_token,p_refresh_token:token.refresh_token,p_token_type:token.token_type,p_scopes:token.scope??[],p_expires_at:new Date(Date.now()+token.expires_in*1000).toISOString(),p_external_user_id:user.id,p_external_login:user.login });
  await supabase.from("platform_integrations").upsert({ platform:"TWITCH",status:"connected",channel_login:channel.login,external_user_id:channel.id,display_name:user.display_name,bot_user_id:user.id,bot_login:user.login,bot_display_name:user.display_name,scopes:token.scope??[],eventsub_status:"pending",last_synced_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString() });
  await supabase.from("bot_channels").update({ channel_name:channel.login,enabled:true,connection_status:"connected",last_connected_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString() }).eq("platform","TWITCH");
  return Response.redirect(`${siteUrl}/control#twitch-connected`, 302);
});
