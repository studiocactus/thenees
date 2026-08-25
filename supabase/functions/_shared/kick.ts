import { serviceClient } from "./supabase.ts";

export const kickScopes = ["user:read", "channel:read", "chat:write", "events:subscribe"];

export async function getKickToken() {
  const supabase = serviceClient();
  const { data, error } = await supabase.rpc("get_platform_token", { p_platform: "KICK" });
  if (error || !data?.[0]) throw new Error("kick_not_connected");
  const stored = data[0] as {access_token:string;refresh_token:string|null;expires_at:string|null;external_user_id:string;external_login:string;scopes:string[]};
  if (!stored.expires_at || Date.parse(stored.expires_at) > Date.now() + 5 * 60 * 1000) return stored;
  if (!stored.refresh_token) throw new Error("kick_refresh_token_missing");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: stored.refresh_token,
    client_id: Deno.env.get("KICK_CLIENT_ID")!,
    client_secret: Deno.env.get("KICK_CLIENT_SECRET")!,
  });
  const response = await fetch("https://id.kick.com/oauth/token", { method: "POST", body });
  if (!response.ok) throw new Error(`kick_refresh_${response.status}`);
  const refreshed = await response.json();
  const next = {
    ...stored,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? stored.refresh_token,
    scopes: refreshed.scope ? String(refreshed.scope).split(" ") : stored.scopes,
    expires_at: new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString(),
  };
  await supabase.rpc("store_platform_token", { p_platform:"KICK",p_access_token:next.access_token,p_refresh_token:next.refresh_token,p_token_type:"bearer",p_scopes:next.scopes,p_expires_at:next.expires_at,p_external_user_id:next.external_user_id,p_external_login:next.external_login });
  return next;
}

export async function kickFetch(path: string, init: RequestInit = {}) {
  const token = await getKickToken();
  const response = await fetch(`https://api.kick.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`kick_${response.status}:${await response.text()}`);
  return response;
}
