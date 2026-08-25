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

async function greetFirstChatMessage(event: TwitchEvent) {
  const supabase=serviceClient();
  const sessionDate=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const {error}=await supabase.from("bot_chat_presence").insert({platform:"TWITCH",platform_user_id:event.chatter_user_id,username:event.chatter_user_login,display_name:event.chatter_user_name,session_date:sessionDate});
  if(error?.code==="23505")return;
  if(error)return;
  const payload={user:event.chatter_user_login,username:event.chatter_user_login,display_name:event.chatter_user_name,platform:"TWITCH",session_date:sessionDate};
  const {data:special}=await supabase.from("bot_viewer_messages").select("message_template").eq("platform","TWITCH").eq("enabled",true).ilike("username",event.chatter_user_login).maybeSingle();
  const {data:queuedId}=special?await supabase.from("bot_outbox").insert({event_key:"special_viewer_message",target_platform:"TWITCH",payload,rendered_message:special.message_template,dedupe_key:`twitch-special-welcome:${event.chatter_user_id}:${sessionDate}`}).select("id").single():await supabase.rpc("enqueue_bot_event",{p_event_key:"first_chat_message",p_payload:payload,p_dedupe_key:`twitch-welcome:${event.chatter_user_id}:${sessionDate}`});
  if(!queuedId)return;
  const workerSecret=Deno.env.get("BOT_WORKER_SECRET");
  const projectUrl=Deno.env.get("SUPABASE_URL");
  if(workerSecret&&projectUrl)await fetch(`${projectUrl}/functions/v1/twitch-worker`,{method:"POST",headers:{"x-worker-secret":workerSecret,"Content-Type":"application/json"},body:"{}"});
}

async function handleCommand(event: TwitchEvent) {
  const text = String(event.message?.text ?? "").trim();
  if (!text.startsWith("!")) return;
  const [commandName, ...argumentsList] = text.split(/\s+/);
  const supabase = serviceClient();
  const badges = event.badges ?? [];
  const isBroadcaster = event.chatter_user_id === event.broadcaster_user_id;
  const isModerator = isBroadcaster || badges.some((badge) => badge.set_id === "moderator");
  const sendModeratorFeedback=async(message:string)=>{
    await supabase.rpc("enqueue_bot_event",{p_event_key:"moderator_feedback",p_payload:{message,user:event.chatter_user_login,command:commandName.toLowerCase(),source_message_id:event.message_id,platform:"TWITCH"},p_dedupe_key:`twitch-command:${event.message_id}`});
    const workerSecret=Deno.env.get("BOT_WORKER_SECRET"),projectUrl=Deno.env.get("SUPABASE_URL");
    if(workerSecret&&projectUrl)await fetch(`${projectUrl}/functions/v1/twitch-worker`,{method:"POST",headers:{"x-worker-secret":workerSecret,"Content-Type":"application/json"},body:"{}"});
  };
  if(commandName.toLowerCase()==="!especial"){
    if(!isModerator)return;
    const action=String(argumentsList[0]??"ajuda").toLowerCase();
    const isDirectTarget=action.startsWith("@");
    const target=String(isDirectTarget?action:argumentsList[1]??"").replace(/^@/,"").toLowerCase();
    const messageTemplate=(isDirectTarget?argumentsList.slice(1):argumentsList.slice(2)).join(" ").trim().slice(0,500);
    let feedback="MOD: !especial @usuario mensagem | remover @usuario | ligar @usuario | desligar @usuario";
    if(isDirectTarget&&target&&messageTemplate){
      const {error}=await supabase.from("bot_viewer_messages").upsert({platform:"TWITCH",username:target,display_name:target,message_template:messageTemplate,enabled:true,created_by:event.chatter_user_login,updated_at:new Date().toISOString()},{onConflict:"platform,username"});
      feedback=error?`Não consegui salvar a mensagem especial de @${target}.`:`Mensagem especial de @${target} salva para a Twitch.`;
    }else if(["remover","apagar"].includes(action)&&target){
      const {error}=await supabase.from("bot_viewer_messages").delete().eq("platform","TWITCH").ilike("username",target);
      feedback=error?`Não consegui remover a mensagem de @${target}.`:`Mensagem especial de @${target} removida.`;
    }else if(["ligar","desligar"].includes(action)&&target){
      const {data,error}=await supabase.from("bot_viewer_messages").update({enabled:action==="ligar",updated_at:new Date().toISOString()}).eq("platform","TWITCH").ilike("username",target).select("id").maybeSingle();
      feedback=error||!data?`Mensagem especial de @${target} não encontrada.`:`Mensagem de @${target} ${action==="ligar"?"ativada":"desativada"}.`;
    }
    await sendModeratorFeedback(feedback);return;
  }
  const { data: command } = await supabase.from("bot_commands").select("*").eq("command", commandName.toLowerCase()).eq("enabled", true).maybeSingle();
  if (!command) return;
  if(command.platform_scope==="KICK")return;
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
  if (usage && Date.now() - Date.parse(usage.used_at) < command.cooldown_seconds * 1000) {
    await supabase.from("bot_command_events").insert({command_id:command.id,command:command.command,platform:"TWITCH",platform_user_id:event.chatter_user_id,username:event.chatter_user_login,arguments:argumentsList.join(" "),outcome:"cooldown"});
    return;
  }
  if(Number(command.global_cooldown_seconds)>0){
    const {data:globalUsage}=await supabase.from("bot_command_global_usage").select("used_at").eq("platform","TWITCH").eq("command_id",command.id).maybeSingle();
    if(globalUsage&&Date.now()-Date.parse(globalUsage.used_at)<Number(command.global_cooldown_seconds)*1000)return;
    await supabase.from("bot_command_global_usage").upsert({platform:"TWITCH",command_id:command.id,used_at:new Date().toISOString()});
  }
  await supabase.from("bot_command_usage").upsert({ platform:"TWITCH",command_id:command.id,platform_user_id:event.chatter_user_id,used_at:new Date().toISOString() });

  const respondToModerator = async (message: string) => {
    await supabase.rpc("enqueue_bot_event", {
      p_event_key:"moderator_feedback",
      p_payload:{message,user:event.chatter_user_login,command:command.command,source_message_id:event.message_id,platform:"TWITCH"},
      p_dedupe_key:`twitch-command:${event.message_id}`,
    });
    const workerSecret = Deno.env.get("BOT_WORKER_SECRET");
    const projectUrl = Deno.env.get("SUPABASE_URL");
    if (workerSecret && projectUrl) await fetch(`${projectUrl}/functions/v1/twitch-worker`, { method:"POST",headers:{"x-worker-secret":workerSecret,"Content-Type":"application/json"},body:"{}" });
  };

  if (command.command === "!comando") {
    const action = String(argumentsList.shift() ?? "ajuda").toLowerCase();
    const managedCommand = String(argumentsList.shift() ?? "").toLowerCase();
    const response = argumentsList.join(" ").replace(/^\|\s*/, "").trim().slice(0, 500);
    let botMessage = "MOD: !comando criar !nome resposta | editar !nome resposta | ligar !nome | desligar !nome | apagar !nome";
    if (["criar","editar","ligar","desligar","apagar"].includes(action) && !/^![a-z0-9_]+$/.test(managedCommand)) {
      botMessage = `@${event.chatter_user_login}, use um nome como !meucomando.`;
    } else if (action === "criar" && response) {
      const { data: existing } = await supabase.from("bot_commands").select("id").eq("command",managedCommand).maybeSingle();
      if (existing) botMessage = `@${event.chatter_user_login}, ${managedCommand} já existe.`;
      else {
        const { error } = await supabase.from("bot_commands").insert({command:managedCommand,description:`Criado no chat por @${event.chatter_user_login}.`,response_template:response,permission:"everyone",cooldown_seconds:15,enabled:false,sort_order:100});
        botMessage = error ? `Não consegui criar ${managedCommand}.` : `${managedCommand} foi criado desligado. Revise e ative no Control.`;
      }
    } else if (action === "editar" && response) {
      const { data,error } = await supabase.from("bot_commands").update({response_template:response,updated_at:new Date().toISOString()}).eq("command",managedCommand).select("id").maybeSingle();
      botMessage = error || !data ? `${managedCommand} não foi encontrado.` : `${managedCommand} recebeu uma nova resposta. ArrobaSrv anotou tudo.`;
    } else if (action === "ligar" || action === "desligar") {
      const { data,error } = await supabase.from("bot_commands").update({enabled:action==="ligar",updated_at:new Date().toISOString()}).eq("command",managedCommand).select("id").maybeSingle();
      botMessage = error || !data ? `${managedCommand} não foi encontrado.` : `${managedCommand} está ${action==="ligar"?"ligado e pronto para o caos":"desligado e pensando no que fez"}.`;
    } else if (action === "apagar") {
      const { data,error } = await supabase.from("bot_commands").delete().eq("command",managedCommand).select("id").maybeSingle();
      botMessage = error || !data ? `${managedCommand} não foi encontrado.` : `${managedCommand} foi removido do inventário.`;
    }
    await respondToModerator(botMessage);
    return;
  }

  if (command.command === "!mensagem") {
    const action = String(argumentsList.shift() ?? "ajuda").toLowerCase();
    const raw = argumentsList.join(" ");
    const [rawKey,...messageParts] = raw.split("|");
    const eventKey = rawKey.trim().toLowerCase().replace(/[^a-z0-9_]/g,"_");
    const messageTemplate = messageParts.join("|").trim().slice(0,500);
    let botMessage = "MOD: !mensagem criar nome | texto | editar nome | texto | apagar nome";
    if (["criar","editar","apagar"].includes(action) && !eventKey) botMessage = "Dê um nome curto para a mensagem. Ex.: !mensagem criar discord | Entrem no Discord!";
    else if (action === "criar" && messageTemplate) {
      const { error } = await supabase.from("bot_automations").insert({event_key:`manual_${eventKey}`,label:eventKey.replace(/_/g," ").toUpperCase(),message_template:messageTemplate,target_platform:"BOTH",enabled:false,include_site_link:false});
      botMessage = error ? `A mensagem ${eventKey} já existe ou não pôde ser criada.` : `Mensagem ${eventKey} criada desligada. Revise no Control antes de ativar.`;
    } else if (action === "editar" && messageTemplate) {
      const { data,error } = await supabase.from("bot_automations").update({message_template:messageTemplate,updated_at:new Date().toISOString()}).eq("event_key",`manual_${eventKey}`).select("event_key").maybeSingle();
      botMessage = error || !data ? `Mensagem ${eventKey} não encontrada.` : `Mensagem ${eventKey} atualizada.`;
    } else if (action === "apagar") {
      const { data,error } = await supabase.from("bot_automations").delete().eq("event_key",`manual_${eventKey}`).select("event_key").maybeSingle();
      botMessage = error || !data ? `Mensagem ${eventKey} não encontrada.` : `Mensagem ${eventKey} removida.`;
    }
    await respondToModerator(botMessage);
    return;
  }

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

  if(command.command==="!comandos"){
    const {data:activeCommands}=await supabase.from("bot_commands").select("command").eq("enabled",true).in("permission",["everyone","follower","subscriber"]).order("sort_order");
    const commandList=(activeCommands??[]).map((item)=>item.command).join(", ")||"nenhum por enquanto";
    const configuredTemplate=command.response_template.trim()||"Comandos na mochila: {{commands}}. Use com moderação ou sem nenhuma.";
    const message=configuredTemplate.includes("{{commands}}")?configuredTemplate.replaceAll("{{commands}}",commandList):`${configuredTemplate} ${commandList}`;
    await supabase.rpc("enqueue_bot_event",{
      p_event_key:"command_response",
      p_payload:{message,user:event.chatter_user_login,display_name:event.chatter_user_name,command:command.command,source_message_id:event.message_id,platform:"TWITCH"},
      p_dedupe_key:`twitch-command:${event.message_id}`,
    });
    const workerSecret=Deno.env.get("BOT_WORKER_SECRET");
    const projectUrl=Deno.env.get("SUPABASE_URL");
    if(workerSecret&&projectUrl)await fetch(`${projectUrl}/functions/v1/twitch-worker`,{method:"POST",headers:{"x-worker-secret":workerSecret,"Content-Type":"application/json"},body:"{}"});
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
  let dynamicMessage=command.response_template;
  let dynamicRandom=String(crypto.getRandomValues(new Uint32Array(1))[0]%101);
  let dynamicChoice=argumentsList.join(" ").trim();
  let dynamicCounter="0";
  let dynamicUserCount="0";
  // !lurk is a system command: keep its individual counter active even if an
  // older dashboard save left command_type as "text" in the database.
  const effectiveCommandType=command.command==="!lurk"?"user_counter":command.command_type;
  if(["random","eight_ball"].includes(effectiveCommandType)){
    const {data:responses}=await supabase.from("bot_command_responses").select("response_template,weight").eq("command_id",command.id).eq("enabled",true).order("sort_order");
    if(responses?.length){const pool=responses.flatMap((item)=>Array(Math.max(1,Math.min(100,item.weight))).fill(item.response_template));dynamicMessage=pool[crypto.getRandomValues(new Uint32Array(1))[0]%pool.length];}
  }
  if(effectiveCommandType==="dice"){
    const sides=Math.max(2,Math.min(1000,Number(argumentsList[0])||6));
    dynamicRandom=String((crypto.getRandomValues(new Uint32Array(1))[0]%sides)+1);
  }
  if(effectiveCommandType==="choice"){
    const choices=argumentsList.join(" ").split("|").map((item)=>item.trim()).filter(Boolean);
    dynamicChoice=choices.length?choices[crypto.getRandomValues(new Uint32Array(1))[0]%choices.length]:"faltaram opções separadas por |";
  }
  if(effectiveCommandType==="counter"){
    const counterKey=command.command.replace(/^!/,"");
    const {data:counter}=await supabase.from("bot_counters").select("value,increment_message,display_message").eq("counter_key",counterKey).maybeSingle();
    if(counter){let nextValue=Number(counter.value);const operation=argumentsList[0];if(operation==="+")nextValue+=1;else if(operation==="-")nextValue=Math.max(0,nextValue-1);else if(/^\d+$/.test(operation??""))nextValue=Number(operation);if(nextValue!==Number(counter.value))await supabase.from("bot_counters").update({value:nextValue,updated_by:event.chatter_user_login,updated_at:new Date().toISOString()}).eq("counter_key",counterKey);dynamicCounter=String(nextValue);dynamicMessage=nextValue!==Number(counter.value)?counter.increment_message:counter.display_message;}
  }
  if(effectiveCommandType==="user_counter"){
    const sessionDate=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    if(argumentsList[0]?.toLowerCase()==="reset"){
      const target=String(argumentsList[1]??event.chatter_user_login).replace(/^@/,"");
      if(!isModerator)dynamicMessage=`@${event.chatter_user_login}, somente a moderação pode resetar este contador.`;
      else{const {error}=await supabase.from("bot_user_counters").delete().eq("command_id",command.id).eq("platform","TWITCH").eq("session_date",sessionDate).ilike("username",target);dynamicMessage=error?`Não consegui resetar ${command.command} para @${target}.`:`Contador diário de ${command.command} para @${target} resetado pela moderação.`;}
    }else{
      const {data:nextValue,error:counterError}=await supabase.rpc("increment_bot_user_counter",{p_command_id:command.id,p_platform:"TWITCH",p_platform_user_id:event.chatter_user_id,p_username:event.chatter_user_login,p_display_name:event.chatter_user_name,p_session_date:sessionDate});
      if(counterError) throw counterError;
      dynamicUserCount=String(nextValue??1);
    }
  }
  const responsePayload = {
    message:dynamicMessage,user:event.chatter_user_login,display_name:event.chatter_user_name,
    command:command.command,arguments:argumentsList.join(" "),source_message_id:event.message_id,
    target:String(argumentsList[0] ?? event.chatter_user_login).replace(/^@/,""),random_number:dynamicRandom,random_response:dynamicMessage,choice:dynamicChoice,counter_value:dynamicCounter,user_count:dynamicUserCount,value:dynamicCounter,
    profile_url:`https://thenees.com.br/jogar?player=${encodeURIComponent(event.chatter_user_login)}`,
    rank,level:String(player?.level ?? 1),category:player?.category ?? "SEM CLASSE",
    birthday_users:(birthdayPlayers ?? []).map((item) => `@${item.username}`).join(", ") || "nenhum jogador hoje",platform:"TWITCH",
  };
  if (command.command === "!comandos") {
    const { data: activeCommands } = await supabase.from("bot_commands").select("command").eq("enabled",true).in("permission",["everyone","follower","subscriber"]).order("sort_order");
    const commandList=(activeCommands??[]).map((item)=>item.command).join(", ")||"nenhum por enquanto";
    const configuredTemplate=command.response_template.trim()||"Comandos na mochila: {{commands}}. Use com moderação ou sem nenhuma.";
    responsePayload.message=configuredTemplate.includes("{{commands}}")?configuredTemplate.replaceAll("{{commands}}",commandList):`${configuredTemplate} ${commandList}`;
  }
  if (command.command === "!quote") {
    const requestedNumber=Number(argumentsList[0]);
    if(argumentsList.length && !(Number.isInteger(requestedNumber)&&requestedNumber>0)) {
      const quoteText = argumentsList.join(" ").slice(0, 500);
      await supabase.from("community_quotes").insert({ quote_text:quoteText,author_name:event.chatter_user_login,platform:"TWITCH",quoted_at:new Date().toISOString(),approved:isModerator,status:isModerator?"approved":"pending",submitted_by:event.chatter_user_login,source_message_id:event.message_id });
      responsePayload.message=isModerator?`Quote salva. O arquivo comprometedor cresceu mais um pouco.`:`Quote enviada para a moderação. O ArrobaSrv não julga, só arquiva.`;
    } else {
      let quoteQuery=supabase.from("community_quotes").select("quote_number,quote_text,author_name").eq("approved",true);
      if(Number.isInteger(requestedNumber)&&requestedNumber>0)quoteQuery=quoteQuery.eq("quote_number",requestedNumber);
      const {data:quotes}=await quoteQuery.limit(Number.isInteger(requestedNumber)&&requestedNumber>0?1:50);
      const chosen=quotes?.length?quotes[Math.floor(Math.random()*quotes.length)]:null;
      responsePayload.message=chosen?`Quote #${chosen.quote_number}: “${chosen.quote_text}” — @${chosen.author_name}`:"O arquivo de quotes está mais vazio que promessa de segunda-feira.";
    }
    await supabase.rpc("enqueue_bot_event", { p_event_key:"command_response",p_payload:responsePayload,p_dedupe_key:`twitch-command:${event.message_id}` });
  } else {
    await supabase.rpc("enqueue_bot_event", { p_event_key:"command_response",p_payload:responsePayload,p_dedupe_key:`twitch-command:${event.message_id}` });
  }
  await supabase.from("bot_command_events").insert({command_id:command.id,command:command.command,platform:"TWITCH",platform_user_id:event.chatter_user_id,username:event.chatter_user_login,arguments:argumentsList.join(" "),outcome:"sent",metadata:{command_type:effectiveCommandType??"text"}});

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
  if (type === "channel.chat.message") {
    await greetFirstChatMessage(event);
    await handleCommand(event);
  }
  if (type === "channel.follow") await supabase.rpc("enqueue_bot_event",{p_event_key:"follow_received",p_payload:{message:`@${event.user_login} seguiu o canal. Energia coletiva +8%.`,user:event.user_login,event_type:"follow",platform:"TWITCH"},p_dedupe_key:`twitch-follow:${messageId}`});
  if (["channel.subscribe","channel.subscription.message"].includes(type)) await supabase.rpc("enqueue_bot_event",{p_event_key:"sub_received",p_payload:{message:`@${event.user_login} virou sub. Buff de grupo desbloqueado!`,user:event.user_login,event_type:"sub",tier:event.tier,platform:"TWITCH"},p_dedupe_key:`twitch-sub:${messageId}`});
  if (type === "channel.cheer") await supabase.rpc("enqueue_bot_event",{p_event_key:"bits_received",p_payload:{message:`@${event.user_login??"anônimo"} enviou ${event.bits} bits. Medidor de caos carregado!`,user:event.user_login,event_type:"bits",bits:event.bits,platform:"TWITCH"},p_dedupe_key:`twitch-bits:${messageId}`});
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
