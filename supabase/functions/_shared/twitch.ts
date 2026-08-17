import { serviceClient } from "./supabase.ts";

export const twitchScopes = [
  "user:read:chat", "user:write:chat", "user:bot", "channel:bot", "moderator:read:followers",
  "channel:read:subscriptions", "bits:read", "channel:read:redemptions",
];

export async function getTwitchToken() {
  const supabase = serviceClient();
  const { data, error } = await supabase.rpc("get_platform_token", { p_platform: "TWITCH" });
  if (error || !data?.[0]) throw new Error("twitch_not_connected");
  const stored = data[0] as {access_token:string;refresh_token:string|null;expires_at:string|null;external_user_id:string;external_login:string;scopes:string[]};
  if (!stored.expires_at || Date.parse(stored.expires_at) > Date.now() + 5 * 60 * 1000) return stored;
  if (!stored.refresh_token) throw new Error("twitch_refresh_token_missing");
  const body = new URLSearchParams({ grant_type:"refresh_token",refresh_token:stored.refresh_token,client_id:Deno.env.get("TWITCH_CLIENT_ID")!,client_secret:Deno.env.get("TWITCH_CLIENT_SECRET")! });
  const response = await fetch("https://id.twitch.tv/oauth2/token", { method:"POST",body });
  if (!response.ok) throw new Error(`twitch_refresh_${response.status}`);
  const refreshed = await response.json();
  const next = { ...stored,access_token:refreshed.access_token,refresh_token:refreshed.refresh_token??stored.refresh_token,scopes:refreshed.scope??stored.scopes,expires_at:new Date(Date.now()+refreshed.expires_in*1000).toISOString() };
  await supabase.rpc("store_platform_token",{p_platform:"TWITCH",p_access_token:next.access_token,p_refresh_token:next.refresh_token,p_token_type:"bearer",p_scopes:next.scopes,p_expires_at:next.expires_at,p_external_user_id:next.external_user_id,p_external_login:next.external_login});
  return next;
}

export async function twitchFetch(path: string, init: RequestInit = {}) {
  const token = await getTwitchToken();
  const response = await fetch(`https://api.twitch.tv/helix${path}`, {
    ...init,
    headers: { "Authorization": `Bearer ${token.access_token}`, "Client-Id": Deno.env.get("TWITCH_CLIENT_ID")!, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`twitch_${response.status}:${await response.text()}`);
  return response;
}

export function normalizeChatText(value: string) {
  const normalized = value.normalize("NFC");
  if (!/(?:\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2[\u0080-\u00bf]{1,2})/.test(normalized)) return normalized;
  const windows1252Bytes: Record<number, number> = {
    0x20ac:0x80,0x201a:0x82,0x0192:0x83,0x201e:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x02c6:0x88,
    0x2030:0x89,0x0160:0x8a,0x2039:0x8b,0x0152:0x8c,0x017d:0x8e,0x2018:0x91,0x2019:0x92,0x201c:0x93,
    0x201d:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02dc:0x98,0x2122:0x99,0x0161:0x9a,0x203a:0x9b,
    0x0153:0x9c,0x017e:0x9e,0x0178:0x9f,
  };
  const bytes = Uint8Array.from(Array.from(normalized), (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return windows1252Bytes[codePoint] ?? (codePoint <= 0xff ? codePoint : 0x3f);
  });
  return new TextDecoder("utf-8").decode(bytes).normalize("NFC");
}

export function renderTemplate(template: string, payload: Record<string, unknown>, communityUrl = "https://www.theneees.com.br/#comunidade") {
  const rendered = template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => String(payload[key] ?? (key === "community_url" ? communityUrl : "")));
  return normalizeChatText(rendered).slice(0, 500);
}
