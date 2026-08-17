import { serviceClient } from "../_shared/supabase.ts";
import { twitchFetch } from "../_shared/twitch.ts";

const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
};

type TwitchBadge = { set_id?: string };
type TwitchEvent = {
  message: { text?: string };
  badges?: TwitchBadge[];
  broadcaster_user_id: string;
  chatter_user_id: string;
  chatter_user_login: string;
  chatter_user_name: string;
  message_id: string;
  user_login: string;
  tier: string;
  bits: number;
  id: string;
  [key: string]: unknown;
};

async function verifySignature(request: Request, rawBody: string) {
  const id = request.headers.get("twitch-eventsub-message-id") ?? "";
  const timestamp = request.headers.get("twitch-eventsub-message-timestamp") ?? "";
  const received = request.headers.get("twitch-eventsub-message-signature") ?? "";
  const secret = Deno.env.get("TWITCH_EVENTSUB_SECRET") ?? "";
  const sentAt = Date.parse(timestamp);
  if (!id || !timestamp || !received || !secret || !Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > 10 * 60 * 1000) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = `sha256=${hex(await crypto.subtle.sign("HMAC", key, encoder.encode(id + timestamp + rawBody)))}`;
  return safeEqual(signature, received);
}

async function handleCommand(event: TwitchEvent) {
  const text = String(event.message?.text ?? "").trim();
  if (!text.startsWith("!")) return;
  const [commandName, ...argumentsList] = text.split(/\s+/);
  const supabase = serviceClient();
  const { data: command } = await supabase.from("bot_commands").select("*").eq("command", commandName.toLowerCase()).eq("enabled", true).maybeSingle();
  if (!command) return;
  const badges = event.badges ?? [];
  const isBroadcaster = event.chatter_user_id === event.broadcaster_user_id;
  const isModerator = isBroadcaster || badges.some((badge) => badge.set_id === "moderator");
  const isSubscriber = badges.some((badge) => badge.set_id === "subscriber");
  let isFollower = isSubscriber || isModerator || badges.some((badge) => badge.set_id === "founder");
  if (command.permission === "follower" && !isFollower) {
    try {
      const response = await twitchFetch(`/channels/followers?broadcaster_id=${encodeURIComponent(event.broadcaster_user_id)}&user_id=${encodeURIComponent(event.chatter_user_id)}`);
      const followerResult = await response.json() as { data?: unknown[] };
      isFollower = (followerResult.data ?? []).length > 0;
    } catch { isFollower = false; }
  }
  const allowed = command.permission === "everyone"
    || (command.permission === "follower" && isFollower)
    || (command.permission === "subscriber" && isSubscriber)
    || (command.permission === "moderator" && isModerator)
    || (command.permission === "broadcaster" && isBroadcaster);
  if (!allowed) return;

  const { data: usage } = await supabase.from("bot_command_usage").select("used_at")
    .eq("platform", "TWITCH").eq("command_id", command.id).eq("platform_user_id", event.chatter_user_id).maybeSingle();
  if (usage && Date.now() - Date.parse(usage.used_at) < command.cooldown_seconds * 1000) return;
  await supabase.from("bot_command_usage").upsert({ platform:"TWITCH",command_id:command.id,platform_user_id:event.chatter_user_id,used_at:new Date().toISOString() });

  const respondToModerator = async (message: string) => {
    await supabase.rpc("enqueue_bot_event", {
      p_event_key:"moderator_feedback",
      p_payload:{message,user:event.chatter_user_login,command:command.command,source_message_id:event.message_id},
      p_dedupe_key:`twitch-command:${event.message_id}`,
    });
    const workerSecret = Deno.env.get("BOT_WORKER_SECRET");
    const projectUrl = Deno.env.get("SUPABASE_URL");
    if (workerSecret && projectUrl) await fetch(`${projectUrl}/functions/v1/twitch-worker`, { method:"POST",headers:{"x-worker-secret":workerSecret,"Content-Type":"application/json"},body:"{}" });
  };

  if (command.command === "!addcom") {
    const newCommandName = String(argumentsList.shift() ?? "").toLowerCase();
    const newResponse = argumentsList.join(" ").trim().slice(0, 500);
    let botMessage = "Uso correto: !addcom !nome resposta";

    if (/^![a-z0-9_]+$/.test(newCommandName) && newResponse) {
      const { data: existing } = await supabase.from("bot_commands").select("id").eq("command", newCommandName).maybeSingle();
      if (existing) {
        botMessage = `@${event.chatter_user_login}, o comando ${newCommandName} já existe.`;
      } else {
        const { error: createError } = await supabase.from("bot_commands").insert({
          command:newCommandName,
          description:`Criado no chat por @${event.chatter_user_login}.`,
          response_template:newResponse,
          permission:"everyone",
          cooldown_seconds:10,
          enabled:false,
          sort_order:100,
        });
        botMessage = createError
          ? `@${event.chatter_user_login}, não foi possível criar ${newCommandName}.`
          : `@${event.chatter_user_login}, comando ${newCommandName} criado e mantido desativado no Control.`;
      }
    }

    await respondToModerator(botMessage);
    return;
  }

  if (command.command === "!editquote") {
    const quoteNumber = Number(argumentsList.shift());
    const quoteText = argumentsList.join(" ").trim().slice(0, 500);
    let botMessage = `Uso correto: !editquote número nova frase`;
    if (Number.isInteger(quoteNumber) && quoteNumber > 0 && quoteText) {
      const { data: quote } = await supabase.from("community_quotes").select("id,quote_number").eq("quote_number",quoteNumber).maybeSingle();
      if (!quote) botMessage = `@${event.chatter_user_login}, a quote #${quoteNumber} não foi encontrada.`;
      else {
        const { error: updateError } = await supabase.from("community_quotes").update({quote_text:quoteText,updated_at:new Date().toISOString(),last_edited_by:event.chatter_user_login,last_edited_platform:"TWITCH"}).eq("id",quote.id);
        botMessage = updateError ? `@${event.chatter_user_login}, não foi possível editar a quote #${quoteNumber}.` : `@${event.chatter_user_login}, quote #${quoteNumber} atualizada com sucesso.`;
      }
    }
    await respondToModerator(botMessage);
    return;
  }

  if (command.command === "!delquote") {
    const quoteNumber = Number(argumentsList[0]);
    let botMessage = `Uso correto: !delquote número`;
    if (Number.isInteger(quoteNumber) && quoteNumber > 0) {
      const { data: quote } = await supabase.from("community_quotes").select("id,quote_number").eq("quote_number",quoteNumber).maybeSingle();
      if (!quote) botMessage = `@${event.chatter_user_login}, a quote #${quoteNumber} não foi encontrada.`;
      else {
        const { error: deleteError } = await supabase.from("community_quotes").delete().eq("id",quote.id);
        botMessage = deleteError ? `@${event.chatter_user_login}, não foi possível excluir a quote #${quoteNumber}.` : `@${event.chatter_user_login}, quote #${quoteNumber} excluída.`;
      }
    }
    await respondToModerator(botMessage);
    return;
  }

  const { data: player } = await supabase.from("game_players").select("id,username,display_name,category,level,birthday")
    .ilike("username", event.chatter_user_login).maybeSingle();
  let rank = "--";
  if (player) {
    const { count } = await supabase.from("game_players").select("id", { count:"exact",head:true }).gt("level", player.level).eq("active", true);
    rank = String((count ?? 0) + 1);
  }
  const { data: birthdayPlayers } = await supabase.from("community_birthdays_today").select("username");
  const responsePayload = {
    message:command.response_template,user:event.chatter_user_login,display_name:event.chatter_user_name,
    command:command.command,arguments:argumentsList.join(" "),source_message_id:event.message_id,
    profile_url:`https://www.theneees.com.br/jogar?player=${encodeURIComponent(event.chatter_user_login)}`,
    rank,level:String(player?.level ?? 1),category:player?.category ?? "SEM CLASSE",
    birthday_users:(birthdayPlayers ?? []).map((item) => `@${item.username}`).join(", ") || "nenhum jogador hoje",
  };
  if (command.command === "!quote" && argumentsList.length) {
    const quoteText = argumentsList.join(" ").slice(0, 500);
    await supabase.from("community_quotes").insert({ quote_text:quoteText,author_name:event.chatter_user_login,platform:"TWITCH",quoted_at:new Date().toISOString(),approved:isModerator,status:isModerator?"approved":"pending",submitted_by:event.chatter_user_login,source_message_id:event.message_id });
  } else {
    await supabase.rpc("enqueue_bot_event", { p_event_key:"command_response",p_payload:responsePayload,p_dedupe_key:`twitch-command:${event.message_id}` });
  }

  const workerSecret = Deno.env.get("BOT_WORKER_SECRET");
  const projectUrl = Deno.env.get("SUPABASE_URL");
  if (workerSecret && projectUrl) {
    await fetch(`${projectUrl}/functions/v1/twitch-worker`, { method:"POST",headers:{"x-worker-secret":workerSecret,"Content-Type":"application/json"},body:"{}" });
  }
}

async function processEvent(type: string, event: TwitchEvent, messageId: string) {
  const supabase = serviceClient();
  const { error } = await supabase.from("platform_events").insert({ platform:"TWITCH",external_event_id:messageId,event_type:type,payload:event,occurred_at:new Date().toISOString() });
  if (error?.code === "23505") return;
  if (type === "channel.chat.message") await handleCommand(event);
  if (type === "channel.follow") await supabase.rpc("enqueue_bot_event",{p_event_key:"follow_received",p_payload:{message:`@${event.user_login} seguiu o canal. Energia coletiva +8%.`,user:event.user_login,event_type:"follow"},p_dedupe_key:`twitch-follow:${messageId}`});
  if (["channel.subscribe","channel.subscription.message"].includes(type)) await supabase.rpc("enqueue_bot_event",{p_event_key:"sub_received",p_payload:{message:`@${event.user_login} virou sub. Buff de grupo desbloqueado!`,user:event.user_login,event_type:"sub",tier:event.tier},p_dedupe_key:`twitch-sub:${messageId}`});
  if (type === "channel.cheer") await supabase.rpc("enqueue_bot_event",{p_event_key:"bits_received",p_payload:{message:`@${event.user_login??"anônimo"} enviou ${event.bits} bits. Medidor de caos carregado!`,user:event.user_login,event_type:"bits",bits:event.bits},p_dedupe_key:`twitch-bits:${messageId}`});
  if (type === "stream.online") await supabase.rpc("enqueue_bot_event",{p_event_key:"live_started",p_payload:{platform:"TWITCH",live_url:"https://www.twitch.tv/thenees"},p_dedupe_key:`twitch-live:${event.id}`});
  await supabase.from("platform_events").update({processed:true}).eq("platform","TWITCH").eq("external_event_id",messageId);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawBody = await request.text();
  if (!(await verifySignature(request, rawBody))) return new Response("Invalid signature", { status: 403 });
  const body = JSON.parse(rawBody);
  const messageType = request.headers.get("twitch-eventsub-message-type");
  if (messageType === "webhook_callback_verification") {
    await serviceClient().from("twitch_eventsub_subscriptions").update({status:"enabled",updated_at:new Date().toISOString()}).eq("id",body.subscription?.id);
    await serviceClient().from("platform_integrations").update({eventsub_status:"active",last_error:null,updated_at:new Date().toISOString()}).eq("platform","TWITCH");
    return new Response(body.challenge, { status: 200, headers: { "Content-Type":"text/plain", "Content-Length":String(new TextEncoder().encode(body.challenge).length) } });
  }
  if (messageType === "revocation") {
    await serviceClient().from("platform_integrations").update({eventsub_status:"error",last_error:body.subscription?.status??"revoked",updated_at:new Date().toISOString()}).eq("platform","TWITCH");
    return new Response(null, { status: 204 });
  }
  if (messageType === "notification") await processEvent(body.subscription?.type, body.event ?? {}, request.headers.get("twitch-eventsub-message-id") ?? crypto.randomUUID());
  return new Response(null, { status: 204 });
});
