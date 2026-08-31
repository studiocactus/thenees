import { serviceClient } from "../_shared/supabase.ts";

const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq/+l1WnlRrGSolDMA+A8
6rAhMbQGmQ2SapVcGM3zq8ANXjnhDWocMqfWcTd95btDydITa10kDvHzw9WQOqp2
MZI7ZyrfzJuz5nhTPCiJwTwnEtWft7nV14BYRDHvlfqPUaZ+1KR4OCaO/wWIk/rQ
L/TjY0M70gse8rlBkbo2a8rKhu69RQTRsoaf4DVhDPEeSeI5jVrRDGAMGL3cGuyY
6CLKGdjVEM78g3JfYOvDU/RvfqD7L89TZ3iN94jrmWdGz34JNlEI5hqK8dd7C5EF
BEbZ5jgB8s8ReQV8H+MkuffjdAj3ajDDX3DOJMIut1lBrUVD1AaSrGCKHooWoL2e
twIDAQAB
-----END PUBLIC KEY-----`;

const fromBase64=(value:string)=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));
async function verify(request:Request,body:string){
  const id=request.headers.get("Kick-Event-Message-Id")??"";
  const timestamp=request.headers.get("Kick-Event-Message-Timestamp")??"";
  const signature=request.headers.get("Kick-Event-Signature")??"";
  const sentAt=Date.parse(timestamp);
  if(!id||!timestamp||!signature||!Number.isFinite(sentAt)||Math.abs(Date.now()-sentAt)>10*60*1000)return false;
  const der=fromBase64(publicKeyPem.replace(/-----[^-]+-----|\s/g,""));
  const key=await crypto.subtle.importKey("spki",der,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,fromBase64(signature),new TextEncoder().encode(`${id}.${timestamp}.${body}`));
}

async function runWorker(){
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),url=Deno.env.get("SUPABASE_URL");
  if(!serviceKey||!url)throw new Error("kick_worker_service_credentials_missing");
  const response=await fetch(`${url}/functions/v1/kick-worker`,{method:"POST",headers:{Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"},body:"{}"});
  if(!response.ok)throw new Error(`kick_worker_${response.status}:${await response.text()}`);
}

Deno.serve(async(request)=>{
  if(request.method!=="POST")return new Response("Method not allowed",{status:405});
  const raw=await request.text();
  if(!(await verify(request,raw)))return new Response("Invalid signature",{status:403});
  const eventType=request.headers.get("Kick-Event-Type")??"unknown";
  const messageId=request.headers.get("Kick-Event-Message-Id")??crypto.randomUUID();
  const payload=JSON.parse(raw);
  const supabase=serviceClient();
  const {error}=await supabase.from("platform_events").insert({platform:"KICK",external_event_id:messageId,event_type:eventType,payload,occurred_at:new Date().toISOString()});
  if(error?.code==="23505")return new Response(null,{status:204});
  if(error)return new Response("Storage error",{status:500});
  if(eventType==="chat.message.sent"){
    const sender=payload.sender??payload.chatter??payload.user??{};
    const content=String(payload.content??payload.message?.text??payload.message??"").trim();
    const username=String(sender.username??sender.name??sender.slug??"usuario");
    const userId=String(sender.user_id??sender.id??username);
    const displayName=String(sender.name??sender.username??sender.slug??username);
    const sessionDate=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    const {error:presenceError}=await supabase.from("bot_chat_presence").insert({platform:"KICK",platform_user_id:userId,username,display_name:displayName,session_date:sessionDate});
    if(!presenceError){
      const {data:special}=await supabase.from("bot_viewer_messages").select("message_template").eq("platform","KICK").eq("enabled",true).ilike("username",username).maybeSingle();
      if(special)await supabase.from("bot_outbox").insert({event_key:"special_viewer_message",target_platform:"KICK",payload:{user:username,username,display_name:displayName,platform:"KICK",session_date:sessionDate,source_message_id:messageId},rendered_message:special.message_template,dedupe_key:`kick-special-welcome:${userId}:${sessionDate}`});
    }
    const commandName=content.split(/\s+/)[0]?.toLowerCase();
    if(commandName?.startsWith("!")){
      if(commandName==="!especial"){
        const commandArguments=content.split(/\s+/).slice(1);
        const badges=Array.isArray(sender.identity?.badges)?sender.identity.badges:[];
        const isModerator=Boolean(sender.is_moderator||sender.is_broadcaster||badges.some((badge:{type?:string})=>["moderator","broadcaster"].includes(String(badge.type))));
        if(isModerator){
          const action=String(commandArguments[0]??"ajuda").toLowerCase();
          const isDirectTarget=action.startsWith("@");
          const target=String(isDirectTarget?action:commandArguments[1]??"").replace(/^@/,"").toLowerCase();
          const messageTemplate=(isDirectTarget?commandArguments.slice(1):commandArguments.slice(2)).join(" ").trim().slice(0,500);
          let feedback="MOD: !especial @usuario mensagem | remover @usuario | ligar @usuario | desligar @usuario";
          if(isDirectTarget&&target&&messageTemplate){const {error:specialError}=await supabase.from("bot_viewer_messages").upsert({platform:"KICK",username:target,display_name:target,message_template:messageTemplate,enabled:true,created_by:username,updated_at:new Date().toISOString()},{onConflict:"platform,username"});feedback=specialError?`Não consegui salvar a mensagem especial de @${target}.`:`Mensagem especial de @${target} salva para a Kick.`;}
          else if(["remover","apagar"].includes(action)&&target){const {error:specialError}=await supabase.from("bot_viewer_messages").delete().eq("platform","KICK").ilike("username",target);feedback=specialError?`Não consegui remover a mensagem de @${target}.`:`Mensagem especial de @${target} removida.`;}
          else if(["ligar","desligar"].includes(action)&&target){const {data:specialData,error:specialError}=await supabase.from("bot_viewer_messages").update({enabled:action==="ligar",updated_at:new Date().toISOString()}).eq("platform","KICK").ilike("username",target).select("id").maybeSingle();feedback=specialError||!specialData?`Mensagem especial de @${target} não encontrada.`:`Mensagem de @${target} ${action==="ligar"?"ativada":"desativada"}.`;}
          await supabase.rpc("enqueue_bot_event",{p_event_key:"moderator_feedback",p_payload:{message:feedback,user:username,command:commandName,source_message_id:messageId,platform:"KICK"},p_dedupe_key:`kick-command:${messageId}`});
        }
        await supabase.from("platform_events").update({processed:true}).eq("platform","KICK").eq("external_event_id",messageId);await runWorker();return new Response(null,{status:204});
      }
      const {data:exactCommand}=await supabase.from("bot_commands").select("*").eq("command",commandName).eq("enabled",true).maybeSingle();
      let command=exactCommand;
      if(!command){const {data:aliasCommand}=await supabase.from("bot_commands").select("*").contains("aliases",[commandName]).eq("enabled",true).limit(1).maybeSingle();command=aliasCommand;}
      // !lurker predates platform_scope. Keep this community command available
      // on both chats even if an older record was accidentally saved as TWITCH.
      const availableCommand=command&&(command.platform_scope!=="TWITCH"||["!lurk","!lurker"].includes(command.command))?command:null;
      if(availableCommand){
        if((availableCommand.run_when??"always")!=="always"){
          const {data:streamStatus}=await supabase.from("platform_events").select("payload").eq("platform","KICK").eq("event_type","livestream.status.updated").order("occurred_at",{ascending:false}).limit(1).maybeSingle();
          const streamLive=typeof streamStatus?.payload?.is_live==="boolean"?streamStatus.payload.is_live:false;
          const statusAllowed=availableCommand.run_when==="online"?streamLive:!streamLive;
          if(!statusAllowed){
            await supabase.from("bot_command_events").insert({command_id:availableCommand.id,command:availableCommand.command,platform:"KICK",platform_user_id:userId,username,arguments:content.slice(commandName.length).trim(),outcome:"denied",metadata:{trigger:commandName,reason:"stream_status",run_when:availableCommand.run_when,is_live:streamLive}});
            await supabase.from("platform_events").update({processed:true}).eq("platform","KICK").eq("external_event_id",messageId);
            return new Response(null,{status:204});
          }
        }
        const commandBadges=Array.isArray(sender.identity?.badges)?sender.identity.badges:[];
        const badgeTypes=commandBadges.map((badge:{type?:string})=>String(badge.type??"").toLowerCase());
        const isBroadcaster=Boolean(sender.is_broadcaster||badgeTypes.includes("broadcaster"));
        const isModerator=Boolean(isBroadcaster||sender.is_moderator||badgeTypes.includes("moderator"));
        const isSubscriber=Boolean(sender.is_subscriber||badgeTypes.some((type:string)=>["subscriber","sub","founder"].includes(type)));
        const isFollower=Boolean(isSubscriber||isModerator||sender.is_follower||badgeTypes.includes("follower"));
        const allowed=availableCommand.permission==="everyone"
          ||(availableCommand.permission==="follower"&&isFollower)
          ||(availableCommand.permission==="subscriber"&&isSubscriber)
          ||(availableCommand.permission==="moderator"&&isModerator)
          ||(availableCommand.permission==="broadcaster"&&isBroadcaster);
        if(!allowed){
          await supabase.from("bot_command_events").insert({command_id:availableCommand.id,command:availableCommand.command,platform:"KICK",platform_user_id:userId,username,arguments:content.slice(commandName.length).trim(),outcome:"denied",metadata:{trigger:commandName,reason:"permission",permission:availableCommand.permission}});
          await supabase.from("platform_events").update({processed:true}).eq("platform","KICK").eq("external_event_id",messageId);
          return new Response(null,{status:204});
        }
        const now=Date.now();
        const {data:userUsage}=await supabase.from("bot_command_usage").select("used_at").eq("platform","KICK").eq("command_id",availableCommand.id).eq("platform_user_id",userId).maybeSingle();
        if(userUsage&&now-Date.parse(userUsage.used_at)<Number(availableCommand.cooldown_seconds??0)*1000){
          await supabase.from("bot_command_events").insert({command_id:availableCommand.id,command:availableCommand.command,platform:"KICK",platform_user_id:userId,username,arguments:content.slice(commandName.length).trim(),outcome:"cooldown",metadata:{trigger:commandName,scope:"user"}});
          await supabase.from("platform_events").update({processed:true}).eq("platform","KICK").eq("external_event_id",messageId);
          return new Response(null,{status:204});
        }
        if(Number(availableCommand.global_cooldown_seconds)>0){
          const {data:globalUsage}=await supabase.from("bot_command_global_usage").select("used_at").eq("platform","KICK").eq("command_id",availableCommand.id).maybeSingle();
          if(globalUsage&&now-Date.parse(globalUsage.used_at)<Number(availableCommand.global_cooldown_seconds)*1000){
            await supabase.from("bot_command_events").insert({command_id:availableCommand.id,command:availableCommand.command,platform:"KICK",platform_user_id:userId,username,arguments:content.slice(commandName.length).trim(),outcome:"cooldown",metadata:{trigger:commandName,scope:"global"}});
            await supabase.from("platform_events").update({processed:true}).eq("platform","KICK").eq("external_event_id",messageId);
            return new Response(null,{status:204});
          }
          await supabase.from("bot_command_global_usage").upsert({platform:"KICK",command_id:availableCommand.id,used_at:new Date(now).toISOString()});
        }
        await supabase.from("bot_command_usage").upsert({platform:"KICK",command_id:availableCommand.id,platform_user_id:userId,used_at:new Date(now).toISOString()});
      }
      if(availableCommand||commandName==="!comandos"){
        const argumentsList=content.slice(commandName.length).trim().split(/\s+/).filter(Boolean);
        let responseTemplate=commandName==="!lurk"
          ? "@{{display_name}} ativou o modo lurk pela {{user_count}}ª vez hoje. Presente, silencioso e oficialmente contabilizado."
          : availableCommand?.response_template??"";
        if(commandName==="!comandos"){
          const {data:active}=await supabase.from("bot_commands").select("command").eq("enabled",true).eq("hidden_from_public",false).in("permission",["everyone","follower","subscriber"]).order("sort_order");
          const commandList=(active??[]).map((item)=>item.command).join(", ")||"nenhum por enquanto";
          const configuredTemplate=responseTemplate.trim()||"Comandos na mochila: {{commands}}. Use com moderação ou sem nenhuma.";
          responseTemplate=configuredTemplate.includes("{{commands}}")?configuredTemplate.replaceAll("{{commands}}",commandList):`${configuredTemplate} ${commandList}`;
        }
        let userCount="0";
        const effectiveCommandType=availableCommand?.command==="!lurk"?"user_counter":availableCommand?.command_type;
        if(effectiveCommandType==="user_counter"){
          const sessionDate=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
          if(argumentsList[0]?.toLowerCase()==="reset"){
            const badges=Array.isArray(sender.identity?.badges)?sender.identity.badges:[];
            const isModerator=Boolean(sender.is_moderator||sender.is_broadcaster||badges.some((badge:{type?:string})=>["moderator","broadcaster"].includes(String(badge.type))));
            const target=String(argumentsList[1]??username).replace(/^@/,"");
            if(!isModerator)responseTemplate=`@${username}, somente a moderação pode resetar este contador.`;
            else{const {error:resetError}=await supabase.from("bot_user_counters").delete().eq("command_id",availableCommand.id).eq("platform","KICK").eq("session_date",sessionDate).ilike("username",target);responseTemplate=resetError?`Não consegui resetar ${availableCommand.command} para @${target}.`:`Contador diário de ${availableCommand.command} para @${target} resetado pela moderação.`;}
          }else{
            const {data:nextValue,error:counterError}=await supabase.rpc("increment_bot_user_counter",{p_command_id:availableCommand.id,p_platform:"KICK",p_platform_user_id:userId,p_username:username,p_display_name:displayName,p_session_date:sessionDate});
            if(counterError)return new Response("Counter error",{status:500});
            userCount=String(nextValue??1);
          }
        }
        const responsePayload={message:responseTemplate,user:username,display_name:displayName,command:commandName,arguments:argumentsList.join(" "),user_count:userCount,platform:"KICK",source_message_id:messageId,delivery_mode:availableCommand?.delivery_mode??"message",announcement_color:availableCommand?.announcement_color??"primary"};
        const {error:queueError}=await supabase.from("bot_outbox").insert({event_key:"command_response",target_platform:"KICK",payload:responsePayload,rendered_message:"{{message}}",dedupe_key:`kick-command:${messageId}`});
        if(queueError&&queueError.code!=="23505")return new Response(`Queue error: ${queueError.message}`,{status:500});
      }
      if(availableCommand){
        await supabase.from("bot_command_events").insert({command_id:availableCommand.id,command:availableCommand.command,platform:"KICK",platform_user_id:userId,username,arguments:content.slice(commandName.length).trim(),outcome:"sent",metadata:{trigger:commandName,command_type:availableCommand.command==="!lurk"?"user_counter":availableCommand.command_type??"text"}});
      }
    }
  }
  if(eventType==="channel.followed"){
    const follower=payload.follower??payload.user??{};
    const username=String(follower.username??follower.name??"alguém");
    await supabase.rpc("enqueue_bot_event",{p_event_key:"follow_received",p_payload:{user:username,username,display_name:String(follower.name??follower.username??username),event_type:"follow",platform:"KICK"},p_dedupe_key:`kick-follow:${messageId}`});
  }
  if(eventType.startsWith("channel.subscription.")){
    const subscriber=payload.subscriber??payload.user??payload.gifter??{};
    const username=String(subscriber.username??subscriber.name??"alguém");
    await supabase.rpc("enqueue_bot_event",{p_event_key:"sub_received",p_payload:{user:username,username,display_name:String(subscriber.name??subscriber.username??username),event_type:eventType,tier:String(payload.tier??payload.subscription?.tier??"1"),platform:"KICK"},p_dedupe_key:`kick-sub:${messageId}`});
  }
  await supabase.from("platform_events").update({processed:true}).eq("platform","KICK").eq("external_event_id",messageId);
  await runWorker();
  return new Response(null,{status:204});
});
