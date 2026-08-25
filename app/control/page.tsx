"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeUtf8Text } from "@/lib/text";

type AccessState = "loading" | "signed_out" | "checking" | "authorized" | "unauthorized" | "setup_required";
type AdminProfile = { user_id:string; display_name: string; email: string; role: string };
type BackendTable = { label: string; table: string; count: number | null };
type HeroContent = { eyebrow: string; version: string; titleLine1: string; titleLine2Lead: string; titleLine2Accent: string; titleLine3: string; subtitle: string; description: string; primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string };
type ProfileItem = { item_key: string; label: string; value: string; helper_text: string; link_url: string | null; sort_order: number; active: boolean };
type DashboardStats = { schedule: number | null; quotes: number | null; messages: number | null; profile: number | null; players: number | null; activePlayers: number | null };
type ScheduleEvent = { id?: string; starts_at: string; title: string; game: string; platform: "TWITCH" | "KICK" | "TWITCH + KICK"; description: string; published: boolean };
type FeaturedVideo = { id?: string; title: string; video_url: string; thumbnail_url: string; published: boolean; sort_order: number };
type SiteContent = { aboutText:string; gameText:string; communityText:string; partnersText:string; labText:string; footerTagline:string; footerBusinessText:string };
type OfficialChannel = { platform:string; url:string };
type OfficialLinks = { twitch:string; kick:string; youtube:string; discord:string; email:string; community:string; channels:OfficialChannel[] };
type TeamMember = { user_id:string;display_name:string;email:string;role:"owner"|"admin"|"editor"|"moderator";active:boolean;created_at:string };
type TeamInvite = { id:string;email:string;role:"admin"|"editor"|"moderator";active:boolean;accepted_at:string|null;created_at:string };
type CommunityMetric = { id?:string;metric_key:string;label:string;value:string;helper_text:string;source:string;is_public:boolean;updated_at?:string };
type CommunityQuote = { id?:string;quote_number?:number;quote_text:string;author_name:string;platform:"TWITCH"|"KICK"|"MANUAL";quoted_at:string;approved:boolean;status:"pending"|"approved"|"rejected"|"archived";submitted_by:string;bot_announced_at:string|null };
type BirthdayPlayer = { id:string;username:string;display_name:string|null;platform:string;category:string|null;birthday:string|null;birthday_public:boolean;birthday_party_enabled:boolean;birthday_message:string|null };
type CommercialFormat = { title:string;description:string };
type PartnerBrand = { name:string;logo_url:string;active:boolean };
type CommercialContent = { coverEyebrow:string;coverTitle:string;coverDescription:string;aboutTitle:string;aboutText:string;differenceTitle:string;differenceText:string;formats:CommercialFormat[];partners:PartnerBrand[] };
type ContactMessage = { id:string;sender_name:string;sender_email:string;company:string|null;contact_type:string|null;subject:string;message:string;status:"new"|"read"|"replied"|"archived"|"spam";admin_notes:string|null;created_at:string;replied_at:string|null };
type BotChannel = { platform:"TWITCH"|"KICK";channel_name:string;enabled:boolean;connection_status:"disconnected"|"configured"|"connected"|"error";last_connected_at:string|null;last_error:string|null };
type BotCommand = { id:string;command:string;description:string;response_template:string;permission:"everyone"|"follower"|"subscriber"|"moderator"|"broadcaster";cooldown_seconds:number;enabled:boolean;sort_order:number;command_type?:"text"|"random"|"counter"|"user_counter"|"dice"|"choice"|"eight_ball";category?:string;platform_scope?:"TWITCH"|"KICK"|"BOTH";global_cooldown_seconds?:number;approval_status?:"draft"|"review"|"approved"|"rejected" };
type BotAutomation = { event_key:string;label:string;message_template:string;target_platform:"TWITCH"|"KICK"|"BOTH";enabled:boolean;include_site_link:boolean };
type BotOutboxItem = { id:string;event_key:string;target_platform:string;status:string;attempts:number;created_at:string;last_error:string|null };
type BotUserCounter = { id:string;command_id:string;platform:"TWITCH"|"KICK";username:string;display_name:string|null;session_date:string;value:number;updated_at:string };
type SpecialViewerMessage = { id:string;platform:"TWITCH"|"KICK";username:string;display_name:string|null;message_template:string;enabled:boolean;created_at:string;updated_at:string };
type ViewerCandidate = { platform:"TWITCH"|"KICK";username:string;display_name:string|null;last_seen_at:string };
type ModeratorCommandGuide = { id:string;syntax:string;description:string;category:"commands"|"messages"|"viewers"|"quotes"|"counters";permission:"moderator"|"broadcaster";platform:"TWITCH"|"KICK"|"BOTH" };
type PlatformIntegration = { platform:"TWITCH"|"KICK";status:string;channel_login:string|null;external_user_id:string|null;display_name:string|null;bot_user_id:string|null;bot_login:string|null;bot_display_name:string|null;scopes:string[];eventsub_status:string;last_synced_at:string|null;last_error:string|null };
type ShortLink = { id:string;slug:string;label:string;destinationUrl:string;active:boolean;createdAt:string };
type ControlNotice = { id:number;tone:"saving"|"success"|"error";title:string;message:string };

const botCommandPresets: Array<Omit<BotCommand,"id"|"sort_order"> & { category:string }> = [
  {category:"BOAS-VINDAS",command:"!cheguei",description:"Anuncia a chegada ao chat.",response_template:"@{{display_name}} chegou. Guardem os objetos frágeis e ajam naturalmente.",permission:"everyone",cooldown_seconds:20,enabled:false},
  {category:"INTERAÇÃO",command:"!highfive",description:"Manda um toca aqui para alguém.",response_template:"@{{display_name}} e @{{target}} deram um high five tão forte que o chat perdeu 2 FPS.",permission:"everyone",cooldown_seconds:15,enabled:false},
  {category:"INTERAÇÃO",command:"!duvida",description:"Mede o nível de confiança de uma ideia.",response_template:"O ArrobaSrv calculou {{random_number}}% de chance disso dar certo. Estranhamente, já tivemos planos piores.",permission:"everyone",cooldown_seconds:20,enabled:false},
  {category:"COMUNIDADE",command:"!discord",description:"Compartilha o endereço da comunidade.",response_template:"A comunidade continua depois da live: {{community_url}} — entre por sua conta e risco.",permission:"everyone",cooldown_seconds:45,enabled:false},
  {category:"UTILIDADE",command:"!social",description:"Mostra onde encontrar os canais oficiais.",response_template:"Os links oficiais estão todos organizados aqui: {{community_url}}. Milagre administrativo confirmado.",permission:"everyone",cooldown_seconds:45,enabled:false},
  {category:"MODERAÇÃO",command:"!aviso",description:"Publica um aviso curto da moderação.",response_template:"AVISO DA MODERAÇÃO: {{arguments}}","permission":"moderator",cooldown_seconds:3,enabled:false},
];
const moderatorCommandGuides:ModeratorCommandGuide[]=[
  {id:"command-create",syntax:"!comando criar !nome resposta",description:"Cria um comando desligado para revisão no Control.",category:"commands",permission:"moderator",platform:"BOTH"},
  {id:"command-edit",syntax:"!comando editar !nome resposta",description:"Atualiza a resposta de um comando existente.",category:"commands",permission:"moderator",platform:"BOTH"},
  {id:"command-enable",syntax:"!comando ligar !nome",description:"Ativa um comando revisado no chat.",category:"commands",permission:"moderator",platform:"BOTH"},
  {id:"command-disable",syntax:"!comando desligar !nome",description:"Pausa um comando sem excluir sua configuração.",category:"commands",permission:"moderator",platform:"BOTH"},
  {id:"command-delete",syntax:"!comando apagar !nome",description:"Remove definitivamente um comando cadastrado.",category:"commands",permission:"broadcaster",platform:"BOTH"},
  {id:"message-create",syntax:"!mensagem criar nome | texto",description:"Cria uma mensagem automática desligada para revisão.",category:"messages",permission:"moderator",platform:"BOTH"},
  {id:"message-edit",syntax:"!mensagem editar nome | texto",description:"Altera uma mensagem automática existente.",category:"messages",permission:"moderator",platform:"BOTH"},
  {id:"message-delete",syntax:"!mensagem apagar nome",description:"Remove uma mensagem automática.",category:"messages",permission:"broadcaster",platform:"BOTH"},
  {id:"special-save",syntax:"!especial @usuario mensagem",description:"Cria ou atualiza a saudação exclusiva de um viewer.",category:"viewers",permission:"moderator",platform:"BOTH"},
  {id:"special-disable",syntax:"!especial desligar @usuario",description:"Pausa a saudação especial sem apagá-la.",category:"viewers",permission:"moderator",platform:"BOTH"},
  {id:"special-enable",syntax:"!especial ligar @usuario",description:"Reativa uma saudação especial pausada.",category:"viewers",permission:"moderator",platform:"BOTH"},
  {id:"special-delete",syntax:"!especial remover @usuario",description:"Remove a saudação especial daquele viewer.",category:"viewers",permission:"moderator",platform:"BOTH"},
  {id:"quote-edit",syntax:"!editquote número nova frase",description:"Corrige o texto de uma quote publicada.",category:"quotes",permission:"moderator",platform:"TWITCH"},
  {id:"quote-delete",syntax:"!delquote número",description:"Exclui uma quote pelo número exibido no arquivo.",category:"quotes",permission:"moderator",platform:"TWITCH"},
  {id:"counter-reset",syntax:"!nome-do-comando reset @usuario",description:"Reinicia o contador diário individual daquele comando e usuário.",category:"counters",permission:"moderator",platform:"BOTH"},
];
const defaultWelcomeAutomation:BotAutomation={event_key:"first_chat_message",label:"BOAS-VINDAS NO CHAT",message_template:"@{{display_name}} apareceu no chat! Sejam gentis por pelo menos cinco minutos.",target_platform:"BOTH",enabled:false,include_site_link:false};
const defaultLurkCommand:BotCommand={id:"00000000-0000-4000-8000-000000000017",command:"!lurk",description:"Ativa o modo lurk e conta quantas vezes cada pessoa usou no dia.",response_template:"@{{display_name}} ativou o modo lurk pela {{user_count}}ª vez hoje. Presente, silencioso e oficialmente contabilizado.",permission:"everyone",cooldown_seconds:3,enabled:false,sort_order:17,command_type:"user_counter",category:"community",platform_scope:"TWITCH",global_cooldown_seconds:1,approval_status:"approved"};
const botCommandsSnapshot=(items:BotCommand[])=>JSON.stringify(items.map(({id,command,description,response_template,permission,cooldown_seconds,enabled,sort_order,command_type,category,platform_scope,global_cooldown_seconds,approval_status})=>({id,command,description,response_template,permission,cooldown_seconds,enabled,sort_order,command_type,category,platform_scope,global_cooldown_seconds,approval_status})));

const defaultHeroContent: HeroContent = { eyebrow: "SISTEMA OPERACIONAL DA COMUNIDADE", version: "V.01 / 2026", titleLine1: "EU JOGO.", titleLine2Lead: "VOCÊS", titleLine2Accent: "INTERAGEM.", titleLine3: "FUNCIONA.", subtitle: "Twitch + Kick + Games + Comunidade", description: "Um lugar onde assistir à live é só o começo.", primaryLabel: "ASSISTIR AO VIVO", primaryHref: "#live", secondaryLabel: "CONHECER O GAME", secondaryHref: "#game" };
const defaultProfileItems: ProfileItem[] = [
  ["music","MÚSICA PREFERIDA","WITHOUT YOU","AVICII / SPOTIFY ↗","https://open.spotify.com/intl-pt/track/6Pgkp4qUoTmJIPn7ReaGxL?si=18d6bc45a881405f"], ["food","COMIDA","STROGONOFF DE FRANGO","BUFF DE ENERGIA FAVORITO",null], ["place","LUGAR","JAPÃO","PONTO DE SPAWN IDEAL",null], ["dream","SONHO","CONHECER O JAPÃO","MISSÃO PRINCIPAL",null], ["work","O QUE EU FAÇO","DIRETOR DE ARTE / STREAMER","CLASSE PROFISSIONAL",null], ["game","JOGO FAVORITO","ROCK N’ ROLL RACING","MEGA DRIVE / RESPONSÁVEL POR BOA PARTE DA PERSONALIDADE",null], ["skill","SKILL PRINCIPAL","DEITAR SEM SONO","HABILIDADE REALMENTE ÚTIL",null], ["project","PROJETO ATUAL","SER UM STREAMER MELHOR","QUEST ATIVA",null], ["fuel","COMBUSTÍVEL CRIATIVO","CONTATO HUMANO","RECURSO CONSUMIDO EM QUANTIDADES DUVIDOSAS",null], ["hobby","HOBBY FORA DA TELA","MTB","MODO OFFLINE",null], ["defect","DEFEITO DE FÁBRICA","DURMO POUCO","BUG CONHECIDO, PATCH NÃO PREVISTO",null], ["rule","REGRA PESSOAL","NÃO DESISTIR ATÉ CONSEGUIR","CÓDIGO-FONTE MORAL",null],
].map(([item_key,label,value,helper_text,link_url],index) => ({ item_key:item_key as string,label:label as string,value:value as string,helper_text:helper_text as string,link_url:link_url as string|null,sort_order:index+1,active:true }));

const navigationGroups = [
  { number: "00", title: "INÍCIO", items: [["01", "VISÃO GERAL"]] },
  { number: "01", title: "SITE", items: [["01", "PÁGINA INICIAL"], ["02", "TEXTOS E PERFIL"], ["03", "AGENDA E VÍDEOS"], ["04", "LINKS E REDES"]] },
  { number: "02", title: "CHATBATTLE", items: [["01", "CONFIGURAÇÕES"], ["02", "INCENTIVOS"], ["03", "JOGADORES"]] },
  { number: "03", title: "ARROBASRV", items: [["00", "OVERVIEW"], ["01", "COMANDOS CADASTRADOS"], ["02", "QUOTES & MEMÓRIAS"], ["03", "BOAS-VINDAS & AVISOS"], ["04", "LINKS DO CHAT"], ["05", "MANUAL DA MODERAÇÃO"], ["06", "ADICIONAR COMANDO"], ["07", "CONTADORES POR USUÁRIO"], ["08", "CANAIS & STATUS"]] },
  { number: "04", title: "COMUNIDADE & LIVE", items: [["01", "MÉTRICAS"], ["02", "ANIVERSÁRIOS"], ["03", "TRANSMISSÃO"]] },
  { number: "05", title: "COMERCIAL", items: [["01", "MEDIA KIT"], ["02", "PARCERIAS"], ["03", "MENSAGENS"]] },
  { number: "06", title: "ADMINISTRAÇÃO", items: [["01", "EQUIPE E ACESSOS"], ["02", "INTEGRAÇÕES"], ["03", "SISTEMA"]] },
  { number: "07", title: "BACKEND & DADOS", items: [["01", "VISÃO DO BANCO"], ["02", "TABELAS E REGISTROS"], ["03", "SEGURANÇA E LOGS"]] },
] as const;

const backendTableDefinitions = [
  ["ADMINISTRADORES", "admin_users"], ["CONFIGURAÇÕES", "site_settings"], ["PERFIL", "profile_items"],
  ["AGENDA", "schedule_events"], ["VÍDEOS", "featured_videos"], ["MÉTRICAS", "community_metrics"],
  ["QUOTES", "community_quotes"], ["MENSAGENS", "contact_messages"], ["LAB", "lab_projects"], ["GAME", "game_settings"],
  ["JOGADORES", "game_players"], ["PRESENÇA NO GAME", "game_presence"], ["CONVITES DA EQUIPE", "admin_invites"],
  ["CANAIS DO BOT", "bot_channels"], ["COMANDOS DO BOT", "bot_commands"], ["AUTOMAÇÕES DO BOT", "bot_automations"],
  ["FILA DO BOT", "bot_outbox"], ["ENTREGAS DO BOT", "bot_delivery_logs"],
  ["PRESENÇA NO CHAT", "bot_chat_presence"],
  ["CONTADORES POR USUÁRIO", "bot_user_counters"],
  ["INTEGRAÇÕES", "platform_integrations"], ["EVENTOS DAS PLATAFORMAS", "platform_events"], ["EVENTSUB TWITCH", "twitch_eventsub_subscriptions"],
  ["LINKS CURTOS", "short_links"],
] as const;

const formatSaoPauloDateTimeInput = (value: string | number | Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone:"America/Sao_Paulo",
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
    hour:"2-digit",
    minute:"2-digit",
    hourCycle:"h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

const saoPauloDateTimeInputToIso = (value: string) => new Date(`${value}:00-03:00`).toISOString();

const normalizeHttpUrl = (value:string) => {
  const raw=value.trim();
  if(!raw)return null;
  const candidate=/^https?:\/\//i.test(raw)?raw:`https://${raw}`;
  try {
    const url=new URL(candidate);
    return url.hostname.includes(".")?url.toString():null;
  } catch { return null; }
};

const newScheduleEvent = (): ScheduleEvent => ({ starts_at:formatSaoPauloDateTimeInput(Date.now()+86400000),title:"NOVA LIVE",game:"A DEFINIR",platform:"TWITCH + KICK",description:"",published:true });
const defaultFeaturedVideo: FeaturedVideo = { title:"Melhores Momentos das Lives! #01",video_url:"https://www.youtube.com/watch?v=eiEJdsE7pNI",thumbnail_url:"https://i.ytimg.com/vi/eiEJdsE7pNI/maxresdefault.jpg",published:true,sort_order:1 };
const defaultSiteContent: SiteContent = { aboutText:"Thenees transforma live em playground. Aqui a comunidade não fica só olhando — ela vota, interfere, compete e, ocasionalmente, destrói qualquer chance de vitória.",gameText:"Um game persistente que nasce dentro do chat da live. Cada pessoa cria seu personagem, participa usando comandos e, quando a transmissão termina, continua a jornada em sua própria área de perfil.",communityText:"Uma comunidade construída para participar, criar memória e transformar cada transmissão em uma experiência coletiva.",partnersText:"Projetos criativos, conteúdo autêntico e uma comunidade que realmente participa. Vamos criar algo que as pessoas queiram assistir — e lembrar.",labText:"Bots, ferramentas para o chat, encurtador de links, integrações e ideias perigosamente próximas de virar produto.",footerTagline:"Streamer, criador e responsável por transformar interação em experiência.",footerBusinessText:"Parcerias, projetos, eventos e ideias perigosamente próximas de funcionar." };
const siteContentLabels:Record<keyof SiteContent,string> = { aboutText:"SOBRE / APRESENTAÇÃO",gameText:"O GAME / APRESENTAÇÃO",communityText:"COMUNIDADE / APRESENTAÇÃO",partnersText:"PARCERIAS / APRESENTAÇÃO",labText:"THENEES LAB / APRESENTAÇÃO",footerTagline:"RODAPÉ / ASSINATURA",footerBusinessText:"RODAPÉ / TEXTO COMERCIAL" };
const officialPlatformOptions = ["TWITCH","KICK","YOUTUBE","DISCORD","INSTAGRAM","TIKTOK","X / TWITTER","FACEBOOK","SPOTIFY","LINKEDIN"];
const defaultOfficialLinks: OfficialLinks = { twitch:"https://www.twitch.tv/thenees",kick:"https://kick.com/thenees",youtube:"https://www.youtube.com/@theneesr",discord:"https://discord.gg/fUEG3h2ED",email:"contato@thenees.com.br",community:"https://thenees.com.br/#comunidade",channels:[{platform:"TWITCH",url:"https://www.twitch.tv/thenees"},{platform:"KICK",url:"https://kick.com/thenees"},{platform:"YOUTUBE",url:"https://www.youtube.com/@theneesr"},{platform:"DISCORD",url:"https://discord.gg/fUEG3h2ED"}] };
const repairKnownDomain = (value:string) => value.replace(/theneees\.com\.br/gi,"thenees.com.br");
const normalizeOfficialLinks = (value:Partial<OfficialLinks>):OfficialLinks => {
  const merged={...defaultOfficialLinks,...value};
  const channels=Array.isArray(value.channels)&&value.channels.length?value.channels:[{platform:"TWITCH",url:merged.twitch},{platform:"KICK",url:merged.kick},{platform:"YOUTUBE",url:merged.youtube},{platform:"DISCORD",url:merged.discord}];
  return {...merged,email:repairKnownDomain(merged.email),community:repairKnownDomain(merged.community),channels:channels.filter((item)=>item?.platform&&item?.url).map((item)=>({...item,url:repairKnownDomain(item.url)}))};
};
const defaultCommunityMetrics: CommunityMetric[] = [
  {metric_key:"followers",label:"SEGUIDORES",value:"04.2K",helper_text:"TWITCH + KICK",source:"MANUAL",is_public:true},
  {metric_key:"active_subs",label:"SUBS ATIVOS",value:"0328",helper_text:"DADOS AUTORIZADOS",source:"MANUAL",is_public:true},
  {metric_key:"watch_hours",label:"HORAS ASSISTIDAS",value:"18.6K",helper_text:"CALCULADAS PELO SISTEMA",source:"MANUAL",is_public:true},
  {metric_key:"chaos_clips",label:"CLIPES DO CAOS",value:"01.3K",helper_text:"PROVAS DOCUMENTAIS",source:"MANUAL",is_public:true},
];
const defaultCommercialContent: CommercialContent = {coverEyebrow:"STREAMER · DIRETOR DE ARTE · CREATOR",coverTitle:"MARCAS ENTRAM. A COMUNIDADE JOGA.",coverDescription:"Conteúdo, live e experiências interativas construídas para serem vividas — não apenas assistidas.",aboutTitle:"THENEES",aboutText:"Streamer, Diretor de Arte e criador do ChatBattle. Transformo participação do chat em conteúdo, narrativa e experiências que aproximam pessoas e marcas.",differenceTitle:"O CHAT NÃO ASSISTE. ELE DECIDE.",differenceText:"No ChatBattle, a marca pode fazer parte da mecânica: ativar eventos, liberar missões coletivas e recompensar toda a comunidade sem comprar a vitória individual.",formats:[{title:"LIVE PATROCINADA",description:"Produto, desafio e narrativa integrados à transmissão."},{title:"BRANDED GAME",description:"Missões, criaturas e recompensas de marca no ChatBattle."},{title:"CONTEÚDO",description:"YouTube, cortes, redes sociais e campanhas com direção criativa."},{title:"EVENTOS",description:"Presença, cobertura e experiências participativas para a comunidade."}],partners:[{name:"NVIDIA",logo_url:"",active:true},{name:"AMD",logo_url:"",active:true},{name:"SAMSUNG",logo_url:"",active:true},{name:"FIFINE",logo_url:"",active:true},{name:"PARCEIRO 05",logo_url:"",active:true},{name:"SUA MARCA AQUI",logo_url:"",active:true}]};
const allControlAreas=navigationGroups.flatMap((group)=>group.items.map(([number])=>`${group.number}-${number}`));
const unavailableControlAreas=new Set(["02-01","02-02","02-03","04-03","06-03"]);
const roleAreas:Record<string,string[]>={owner:allControlAreas,admin:allControlAreas,editor:["00-01","01-01","01-02","01-03","01-04","04-01","05-01","05-02","05-03"],moderator:["00-01","02-01","02-02","02-03","03-00","03-01","03-02","03-03","03-04","03-05","03-06","03-07","03-08","04-02","04-03"]};

export default function ControlPage() {
  const [accessState, setAccessState] = useState<AccessState>(isSupabaseConfigured ? "loading" : "setup_required");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [backendTables, setBackendTables] = useState<BackendTable[]>(backendTableDefinitions.map(([label, table]) => ({ label, table, count: null })));
  const [backendSearch, setBackendSearch] = useState("");
  const [heroContent, setHeroContent] = useState<HeroContent>(defaultHeroContent);
  const [heroSaveState, setHeroSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileItems, setProfileItems] = useState<ProfileItem[]>(defaultProfileItems);
  const [openContentKey, setOpenContentKey] = useState<keyof SiteContent | null>(null);
  const [openProfileKey, setOpenProfileKey] = useState<string | null>(null);
  const [profileSaveState, setProfileSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // Navigation ids are data-driven and may expand without changing this component.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedArea, setSelectedArea] = useState<any>("00-01");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ schedule:null, quotes:null, messages:null, profile:null, players:null, activePlayers:null });
  const [gameName, setGameName] = useState("ChatBattle");
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [deletedScheduleIds, setDeletedScheduleIds] = useState<string[]>([]);
  const [savingScheduleIndex, setSavingScheduleIndex] = useState<number | null>(null);
  const [savedScheduleIndex, setSavedScheduleIndex] = useState<number | null>(null);
  const [featuredVideo, setFeaturedVideo] = useState<FeaturedVideo>(defaultFeaturedVideo);
  const [scheduleSaveState, setScheduleSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);
  const [officialLinks, setOfficialLinks] = useState<OfficialLinks>(defaultOfficialLinks);
  const [officialPlatform, setOfficialPlatform] = useState("TWITCH");
  const [officialPlatformUrl, setOfficialPlatformUrl] = useState("");
  const [officialPlatformError, setOfficialPlatformError] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"upcoming"|"past"|"all">("upcoming");
  const [contentSaveState, setContentSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [linksSaveState, setLinksSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [authMode, setAuthMode] = useState<"login"|"register">("login");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<"all"|"active"|"suspended">("all");
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamInvite["role"]>("moderator");
  const [teamMessage, setTeamMessage] = useState("");
  const [communityMetrics, setCommunityMetrics] = useState<CommunityMetric[]>(defaultCommunityMetrics);
  const [communityQuotes, setCommunityQuotes] = useState<CommunityQuote[]>([]);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [birthdayPlayers, setBirthdayPlayers] = useState<BirthdayPlayer[]>([]);
  const [birthdaySearch, setBirthdaySearch] = useState("");
  const [birthdayFilter, setBirthdayFilter] = useState<"all"|"enabled"|"disabled">("all");
  const [savingBirthdayId, setSavingBirthdayId] = useState<string|null>(null);
  const [savedBirthdayId, setSavedBirthdayId] = useState<string|null>(null);
  const [communitySaveState, setCommunitySaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [quoteDraft, setQuoteDraft] = useState<CommunityQuote>({quote_text:"",author_name:"",platform:"MANUAL",quoted_at:formatSaoPauloDateTimeInput(new Date()),approved:true,status:"approved",submitted_by:"THENEES CONTROL",bot_announced_at:null});
  const [commercialContent, setCommercialContent] = useState<CommercialContent>(defaultCommercialContent);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactFilter, setContactFilter] = useState<"all"|ContactMessage["status"]>("all");
  const [savingContactId, setSavingContactId] = useState<string|null>(null);
  const [savedContactId, setSavedContactId] = useState<string|null>(null);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState<"all"|"visible"|"hidden">("all");
  const [commercialSaveState, setCommercialSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [botChannels, setBotChannels] = useState<BotChannel[]>([]);
  const [botCommands, setBotCommands] = useState<BotCommand[]>([]);
  const lastBotCommandsSnapshot=useRef("");
  const botCommandAutosaveTimer=useRef<number|null>(null);
  const [openBotCommandId, setOpenBotCommandId] = useState<string | null>(null);
  const [openBotAutomationKey, setOpenBotAutomationKey] = useState<string | null>(null);
  const [showOutboxList,setShowOutboxList]=useState(false);
  const [botCommandSearch, setBotCommandSearch] = useState("");
  const [botCommandFilter, setBotCommandFilter] = useState<"all"|"active"|"inactive">("all");
  const [botCommandError, setBotCommandError] = useState("");
  const [botCommandDraft,setBotCommandDraft]=useState({command:"!",description:"",response_template:"",permission:"everyone" as BotCommand["permission"],command_type:"text" as NonNullable<BotCommand["command_type"]>,category:"community",platform_scope:"BOTH" as NonNullable<BotCommand["platform_scope"]>,cooldown_seconds:15,global_cooldown_seconds:3,responses:[""]});
  const [botCommandCreateState,setBotCommandCreateState]=useState<"idle"|"saving"|"saved"|"error">("idle");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteFilter, setQuoteFilter] = useState<"all"|CommunityQuote["status"]>("all");
  const [showBotVariables, setShowBotVariables] = useState(false);
  const [botAutomations, setBotAutomations] = useState<BotAutomation[]>([]);
  const [automationFilter, setAutomationFilter] = useState<"all"|"active"|"inactive">("all");
  const [moderatorCommandSearch,setModeratorCommandSearch]=useState("");
  const [moderatorCommandCategory,setModeratorCommandCategory]=useState<"all"|ModeratorCommandGuide["category"]>("all");
  const [copiedModeratorCommand,setCopiedModeratorCommand]=useState<string|null>(null);
  const [outboxFilter, setOutboxFilter] = useState("all");
  const [botOutbox, setBotOutbox] = useState<BotOutboxItem[]>([]);
  const [botUserCounters,setBotUserCounters]=useState<BotUserCounter[]>([]);
  const [specialViewerMessages,setSpecialViewerMessages]=useState<SpecialViewerMessage[]>([]);
  const [viewerCandidates,setViewerCandidates]=useState<ViewerCandidate[]>([]);
  const [viewerSearch,setViewerSearch]=useState("");
  const [specialViewerDraft,setSpecialViewerDraft]=useState({platform:"TWITCH" as "TWITCH"|"KICK",username:"",display_name:"",message_template:"@{{display_name}}, o chat ficou oficialmente melhor agora que você chegou."});
  const [specialViewerState,setSpecialViewerState]=useState<"idle"|"saving"|"saved"|"error">("idle");
  const [openSpecialViewerId,setOpenSpecialViewerId]=useState<string|null>(null);
  const [botSaveState, setBotSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [platformIntegrations, setPlatformIntegrations] = useState<PlatformIntegration[]>([]);
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([]);
  const [shortLinkDraft, setShortLinkDraft] = useState({ label:"",slug:"",destinationUrl:"" });
  const [shortLinkState, setShortLinkState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [shortLinkSearch, setShortLinkSearch] = useState("");
  const [copiedShortLinkId, setCopiedShortLinkId] = useState<string|null>(null);
  const [dirtyForms,setDirtyForms]=useState<Set<string>>(()=>new Set());
  const [controlNotice,setControlNotice]=useState<ControlNotice|null>(null);
  const previousSaveStates=useRef<Record<string,string>>({});

  const markFormDirty=(formKey:string)=>setDirtyForms((current)=>current.has(formKey)?current:new Set(current).add(formKey));
  const clearDirtyForms=(...formKeys:string[])=>setDirtyForms((current)=>{const next=new Set(current);formKeys.forEach((key)=>next.delete(key));return next.size===current.size?current:next});

  useEffect(()=>{if(heroSaveState==="saved")clearDirtyForms("hero")},[heroSaveState]);
  useEffect(()=>{if(contentSaveState==="saved")clearDirtyForms("content")},[contentSaveState]);
  useEffect(()=>{if(profileSaveState==="saved")clearDirtyForms("profile")},[profileSaveState]);
  useEffect(()=>{if(scheduleSaveState==="saved")clearDirtyForms("schedule")},[scheduleSaveState]);
  useEffect(()=>{if(linksSaveState==="saved")clearDirtyForms("links")},[linksSaveState]);
  useEffect(()=>{if(communitySaveState==="saved")clearDirtyForms("metrics","quotes")},[communitySaveState]);
  useEffect(()=>{if(commercialSaveState==="saved")clearDirtyForms("media-kit","partners")},[commercialSaveState]);
  useEffect(()=>{if(botSaveState==="saved")clearDirtyForms("bot-core","automations")},[botSaveState]);
  useEffect(()=>{if(shortLinkState==="saved")clearDirtyForms("short-links")},[shortLinkState]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirtyForms.size===0)return;event.preventDefault();event.returnValue=""};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn)},[dirtyForms]);
  useEffect(()=>{
    const saves=[
      ["hero",heroSaveState,"PÁGINA INICIAL"],["profile",profileSaveState,"PERFIL"],["schedule",scheduleSaveState,"AGENDA E VÍDEOS"],
      ["content",contentSaveState,"TEXTOS DO SITE"],["links",linksSaveState,"LINKS E REDES"],["community",communitySaveState,"COMUNIDADE"],
      ["commercial",commercialSaveState,"ÁREA COMERCIAL"],["bot-command",botCommandCreateState,"NOVO COMANDO"],["special-viewer",specialViewerState,"MENSAGEM ESPECIAL"],
      ["bot",botSaveState,"ARROBASRV"],["short-link",shortLinkState,"LINK CURTO"],
    ] as const;
    const changed=saves.find(([key,state])=>previousSaveStates.current[key]!==undefined&&previousSaveStates.current[key]!==state&&state!=="idle");
    saves.forEach(([key,state])=>{previousSaveStates.current[key]=state});
    if(!changed)return;
    const [,state,label]=changed;
    const tone=state==="saving"?"saving":state==="saved"?"success":"error";
    setControlNotice({id:Date.now(),tone,title:state==="saving"?"SALVANDO ALTERAÇÕES":state==="saved"?"ALTERAÇÕES SALVAS":"NÃO FOI POSSÍVEL SALVAR",message:state==="saving"?`${label}: enviando dados com segurança.`:state==="saved"?`${label}: tudo atualizado.`:`${label}: revise os dados e tente novamente.`});
  },[heroSaveState,profileSaveState,scheduleSaveState,contentSaveState,linksSaveState,communitySaveState,commercialSaveState,botCommandCreateState,specialViewerState,botSaveState,shortLinkState]);
  useEffect(()=>{if(!controlNotice||controlNotice.tone==="saving")return;const timer=window.setTimeout(()=>setControlNotice((current)=>current?.id===controlNotice.id?null:current),4200);return()=>window.clearTimeout(timer)},[controlNotice]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    let verifiedUserId:string|null=null;
    let verifyingUserId:string|null=null;

    const verifyAccess = async (userId?: string, force=false) => {
      if (!userId) {
        verifiedUserId=null;
        verifyingUserId=null;
        setAdmin(null);
        setAccessState("signed_out");
        return;
      }
      if(!force&&(verifiedUserId===userId||verifyingUserId===userId))return;
      verifyingUserId=userId;
      setAccessState("checking");
      await supabase.rpc("claim_admin_invite");
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id,display_name,email,role,active")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        verifyingUserId=null;
        setAccessState(error.code === "42P01" ? "setup_required" : "unauthorized");
        setMessage(error.code === "42P01" ? "A estrutura do banco ainda precisa ser instalada." : "Não foi possível confirmar sua permissão.");
        return;
      }
      if (!data) {
        verifyingUserId=null;
        setAccessState("unauthorized");
        setMessage("Usuário autenticado, mas sem permissão administrativa.");
        return;
      }
      setAdmin(data as AdminProfile);
      verifiedUserId=userId;
      verifyingUserId=null;
      setAccessState("authorized");
      setMessage("");
    };

    void supabase.auth.getSession().then(({ data }) => verifyAccess(data.session?.user.id));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGNED_IN can also be emitted when a tab regains focus. Revalidating
      // the same user here made the entire Control briefly return to its login
      // state. Token refreshes must remain invisible to the interface.
      // Supabase recommends keeping this callback synchronous. Running another
      // Supabase request inside it can hold the auth lock and leave the UI in
      // "checking" indefinitely, so access verification runs on the next task.
      if(event==="SIGNED_OUT")setTimeout(()=>void verifyAccess(),0);
      else if(event==="SIGNED_IN"&&session?.user.id)setTimeout(()=>void verifyAccess(session.user.id),0);
      else if(event==="USER_UPDATED"&&session?.user.id)setTimeout(()=>void verifyAccess(session.user.id,true),0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if(accessState!=="checking")return;
    const timeout=window.setTimeout(()=>{
      setAccessState("signed_out");
      setMessage("A verificação demorou mais que o esperado. Tente entrar novamente.");
    },15000);
    return ()=>window.clearTimeout(timeout);
  },[accessState]);

  useEffect(() => {
    if (accessState !== "authorized" || !admin || !["owner", "admin"].includes(admin.role)) return;
    const supabase = getSupabaseBrowserClient();
    void Promise.all(backendTableDefinitions.map(async ([label, table]) => {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
      return { label, table, count };
    })).then(setBackendTables);
  }, [accessState, admin]);

  const loadTeam = async () => {
    const supabase = getSupabaseBrowserClient();
    const [members,invites] = await Promise.all([
      supabase.from("admin_users").select("user_id,display_name,email,role,active,created_at").order("created_at"),
      supabase.from("admin_invites").select("id,email,role,active,accepted_at,created_at").order("created_at",{ascending:false}),
    ]);
    if (members.data) setTeamMembers(members.data as TeamMember[]);
    if (invites.data) setTeamInvites(invites.data as TeamInvite[]);
  };

  useEffect(() => {
    if (accessState === "authorized" && admin && ["owner","admin"].includes(admin.role)) void loadTeam();
  }, [accessState,admin]);

  useEffect(() => {
    if (accessState !== "authorized") return;
    void getSupabaseBrowserClient().from("site_settings").select("value").eq("key", "hero_content").maybeSingle().then(({ data }) => {
      if (data?.value && typeof data.value === "object") setHeroContent({ ...defaultHeroContent, ...(data.value as Partial<HeroContent>) });
    });
  }, [accessState]);

  useEffect(() => {
    if (accessState !== "authorized") return;
    void getSupabaseBrowserClient().from("site_settings").select("key,value").in("key",["site_content","official_links"]).then(({ data }) => {
      for (const item of data ?? []) {
        if (item.key === "site_content" && item.value && typeof item.value === "object") setSiteContent({ ...defaultSiteContent,...item.value as Partial<SiteContent> });
        if (item.key === "official_links" && item.value && typeof item.value === "object") setOfficialLinks(normalizeOfficialLinks(item.value as Partial<OfficialLinks>));
      }
    });
  }, [accessState]);

  useEffect(() => {
    if (accessState !== "authorized") return;
    const supabase = getSupabaseBrowserClient();
    void Promise.all([
      supabase.from("schedule_events").select("*", { count:"exact", head:true }),
      supabase.from("community_quotes").select("*", { count:"exact", head:true }),
      supabase.from("contact_messages").select("*", { count:"exact", head:true }).eq("status", "new"),
      supabase.from("profile_items").select("*", { count:"exact", head:true }).eq("active", true),
      supabase.from("site_settings").select("value").eq("key", "game").maybeSingle(),
      supabase.from("game_players").select("*", { count:"exact", head:true }).eq("active", true),
      supabase.from("game_presence").select("*", { count:"exact", head:true }).in("status", ["online", "playing"]).gte("last_seen_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    ]).then(([schedule, quotes, messages, profile, game, players, activePlayers]) => {
      setDashboardStats({ schedule:schedule.count, quotes:quotes.count, messages:messages.count, profile:profile.count, players:players.count ?? 0, activePlayers:activePlayers.count ?? 0 });
      const value = game.data?.value as { name?:string } | null;
      if (value?.name) setGameName(value.name);
    });
  }, [accessState]);

  useEffect(() => {
    if (accessState !== "authorized") return;
    void getSupabaseBrowserClient().from("profile_items").select("item_key,label,value,helper_text,link_url,sort_order,active").order("sort_order").then(({ data }) => {
      if (data?.length) setProfileItems(data.map((item) => ({ ...item, helper_text:item.helper_text ?? "" })) as ProfileItem[]);
    });
  }, [accessState]);

  useEffect(() => {
    if (accessState !== "authorized") return;
    const supabase = getSupabaseBrowserClient();
    void Promise.all([
      supabase.from("schedule_events").select("id,starts_at,title,game,platform,description,published").order("starts_at"),
      supabase.from("featured_videos").select("id,title,video_url,thumbnail_url,published,sort_order").order("sort_order").limit(1).maybeSingle(),
    ]).then(([schedule, video]) => {
      if (schedule.data?.length) setScheduleEvents(schedule.data.map((item) => ({ ...item, starts_at:formatSaoPauloDateTimeInput(item.starts_at), game:item.game ?? "", description:item.description ?? "" })) as ScheduleEvent[]);
      else setScheduleEvents([newScheduleEvent()]);
      if (video.data) setFeaturedVideo({ ...video.data, thumbnail_url:video.data.thumbnail_url ?? "" } as FeaturedVideo);
    });
  }, [accessState]);

  const loadCommunity = async () => {
    const supabase = getSupabaseBrowserClient();
    const [metrics,quotesWithNumber,birthdays] = await Promise.all([
      supabase.from("community_metrics").select("id,metric_key,label,value,helper_text,source,is_public,updated_at").order("metric_key"),
      supabase.from("community_quotes").select("id,quote_number,quote_text,author_name,platform,quoted_at,approved,status,submitted_by,bot_announced_at").order("quoted_at",{ascending:false}),
      supabase.from("game_players").select("id,username,display_name,platform,category,birthday,birthday_public,birthday_party_enabled,birthday_message").not("birthday","is",null).order("birthday"),
    ]);
    const quotes = quotesWithNumber.error
      ? await supabase.from("community_quotes").select("id,quote_text,author_name,platform,quoted_at,approved,status,submitted_by,bot_announced_at").order("quoted_at",{ascending:false})
      : quotesWithNumber;
    if (metrics.data?.length) setCommunityMetrics(metrics.data.map((item) => ({...item,helper_text:item.helper_text??""})) as CommunityMetric[]);
    if (quotes.data) setCommunityQuotes(quotes.data.map((item,index) => ({...item,quote_number:"quote_number" in item?item.quote_number:index+1,submitted_by:item.submitted_by??""})) as CommunityQuote[]);
    if (birthdays.data) setBirthdayPlayers(birthdays.data as BirthdayPlayer[]);
  };

  useEffect(() => { if (accessState === "authorized") void loadCommunity(); }, [accessState]);

  const loadCommercial = async () => {
    const supabase = getSupabaseBrowserClient();
    const [content,messages] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key","commercial_content").maybeSingle(),
      supabase.from("contact_messages").select("id,sender_name,sender_email,company,contact_type,subject,message,status,admin_notes,created_at,replied_at").order("created_at",{ascending:false}),
    ]);
    if (content.data?.value && typeof content.data.value === "object") setCommercialContent({...defaultCommercialContent,...content.data.value as Partial<CommercialContent>});
    if (messages.data) setContactMessages(messages.data as ContactMessage[]);
  };

  useEffect(() => { if (accessState === "authorized" && admin && ["owner","admin","editor"].includes(admin.role)) void loadCommercial(); }, [accessState,admin]);

  useEffect(()=>{
    if(accessState!=="authorized"||!admin||!["owner","admin","editor"].includes(admin.role))return;
    const supabase=getSupabaseBrowserClient();
    const refresh=()=>{if(document.visibilityState==="visible")void loadCommercial()};
    const channel=supabase.channel("thenees-control-commercial")
      .on("postgres_changes",{event:"*",schema:"public",table:"contact_messages"},refresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"site_settings",filter:"key=eq.commercial_content"},refresh)
      .subscribe();
    const timer=window.setInterval(refresh,30000);
    document.addEventListener("visibilitychange",refresh);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);void supabase.removeChannel(channel)};
  },[accessState,admin]);

  const loadBotCore = async () => {
    const supabase=getSupabaseBrowserClient();
    const [channels,commands,automations,outbox,links,specialMessages,presence]=await Promise.all([
      supabase.from("bot_channels").select("platform,channel_name,enabled,connection_status,last_connected_at,last_error").order("platform"),
      supabase.from("bot_commands").select("id,command,description,response_template,permission,cooldown_seconds,enabled,sort_order,command_type,category,platform_scope,global_cooldown_seconds,approval_status").order("sort_order"),
      supabase.from("bot_automations").select("event_key,label,message_template,target_platform,enabled,include_site_link").order("event_key"),
      supabase.from("bot_outbox").select("id,event_key,target_platform,status,attempts,created_at,last_error").order("created_at",{ascending:false}).limit(30),
      supabase.from("short_links").select("id,slug,label,destination_url,active,created_at").order("created_at",{ascending:false}),
      supabase.from("bot_viewer_messages").select("id,platform,username,display_name,message_template,enabled,created_at,updated_at").order("updated_at",{ascending:false}),
      supabase.from("bot_chat_presence").select("platform,username,display_name,first_message_at").order("first_message_at",{ascending:false}).limit(500),
    ]);
    if(channels.data)setBotChannels(channels.data as BotChannel[]);
    if(commands.data){const loaded=(commands.data as BotCommand[]).map((item)=>{const responseTemplate=normalizeUtf8Text(item.response_template);return {...item,description:item.command==="!comandos"?"Lista automática dos comandos públicos ativos. Use {{commands}} para posicionar a lista na resposta.":normalizeUtf8Text(item.description),response_template:item.command==="!comandos"&&responseTemplate==="O ArrobaSrv está organizando a gaveta de comandos. Tente novamente em instantes."?"Comandos na mochila: {{commands}}. Use com moderação ou sem nenhuma.":responseTemplate}});const normalized=loaded.some((item)=>item.command==="!lurk")?loaded:[...loaded,defaultLurkCommand];lastBotCommandsSnapshot.current=botCommandsSnapshot(normalized);setBotCommands(normalized);}
    if(automations.data){const loaded=(automations.data as BotAutomation[]).map((item)=>({...item,label:normalizeUtf8Text(item.label),message_template:normalizeUtf8Text(item.message_template)}));setBotAutomations(loaded.some((item)=>item.event_key==="first_chat_message")?loaded:[defaultWelcomeAutomation,...loaded]);}
    if(outbox.data)setBotOutbox(outbox.data as BotOutboxItem[]);
    if(links.data)setShortLinks(links.data.map((item)=>({id:item.id,slug:item.slug,label:item.label,destinationUrl:item.destination_url,active:item.active,createdAt:item.created_at})) as ShortLink[]);
    if(specialMessages.data)setSpecialViewerMessages(specialMessages.data as SpecialViewerMessage[]);
    if(presence.data){const unique=new Map<string,ViewerCandidate>();presence.data.forEach((item)=>{const key=`${item.platform}:${String(item.username).toLowerCase()}`;if(!unique.has(key))unique.set(key,{platform:item.platform as "TWITCH"|"KICK",username:item.username,display_name:item.display_name,last_seen_at:item.first_message_at})});setViewerCandidates([...unique.values()]);}
  };
  const loadBotUserCounters=async()=>{const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(new Date());const {data}=await getSupabaseBrowserClient().from("bot_user_counters").select("id,command_id,platform,username,display_name,session_date,value,updated_at").eq("session_date",today).order("value",{ascending:false});if(data)setBotUserCounters(data as BotUserCounter[]);};
  useEffect(()=>{if(accessState==="authorized"&&admin&&["owner","admin","moderator"].includes(admin.role))void loadBotCore();},[accessState,admin]);
  useEffect(()=>{if(accessState==="authorized"&&admin&&["owner","admin","moderator"].includes(admin.role))void loadBotUserCounters();},[accessState,admin]);
  useEffect(()=>{
    if(accessState!=="authorized"||!admin||!botCommands.length)return;
    const snapshot=botCommandsSnapshot(botCommands);
    if(snapshot===lastBotCommandsSnapshot.current)return;
    if(botCommandAutosaveTimer.current)window.clearTimeout(botCommandAutosaveTimer.current);
    setBotSaveState("saving");
    botCommandAutosaveTimer.current=window.setTimeout(async()=>{
      const normalized=botCommands.map((item)=>item.command.trim().toLowerCase());
      const invalid=botCommands.some((item)=>!/^![a-z0-9_]+$/.test(item.command)||!item.response_template.trim()||item.cooldown_seconds<0)||new Set(normalized).size!==normalized.length;
      if(invalid){setBotCommandError("CORRIJA O COMANDO DESTACADO PARA CONCLUIR O SALVAMENTO AUTOMÁTICO.");setBotSaveState("error");return;}
      const previousCommands=lastBotCommandsSnapshot.current?JSON.parse(lastBotCommandsSnapshot.current) as BotCommand[]:[];
      if(previousCommands.some((item)=>item.command==="!comandos")&&!botCommands.some((item)=>item.command==="!comandos")){setBotCommandError("!COMANDOS É ESSENCIAL E NÃO PODE SER EXCLUÍDO.");setBotSaveState("error");await loadBotCore();return;}
      const removedIds=previousCommands.filter((item)=>!botCommands.some((current)=>current.id===item.id)&&item.command!=="!comandos").map((item)=>item.id);
      const supabase=getSupabaseBrowserClient();
      const {error}=await supabase.from("bot_commands").upsert(botCommands.map((item)=>({...item,command:item.command.trim().toLowerCase(),description:normalizeUtf8Text(item.description),response_template:normalizeUtf8Text(item.response_template),updated_at:new Date().toISOString()})));
      const deleteResult=removedIds.length?await supabase.from("bot_commands").delete().in("id",removedIds):{error:null};
      if(error||deleteResult.error){setBotSaveState("error");setBotCommandError("NÃO FOI POSSÍVEL SALVAR AUTOMATICAMENTE.");return;}
      lastBotCommandsSnapshot.current=snapshot;setBotSaveState("saved");setBotCommandError("");clearDirtyForms("bot-core");
    },700);
    return()=>{if(botCommandAutosaveTimer.current)window.clearTimeout(botCommandAutosaveTimer.current)};
  },[botCommands,accessState,admin]);

  useEffect(()=>{
    if(accessState!=="authorized"||!admin||!["owner","admin","moderator"].includes(admin.role))return;
    const supabase=getSupabaseBrowserClient();
    const refreshBot=()=>{if(document.visibilityState==="visible")void loadBotCore();};
    const refreshCommunity=()=>{if(document.visibilityState==="visible")void loadCommunity();};
    const channel=supabase.channel("thenees-control-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"bot_commands"},refreshBot)
      .on("postgres_changes",{event:"*",schema:"public",table:"bot_channels"},refreshBot)
      .on("postgres_changes",{event:"*",schema:"public",table:"bot_automations"},refreshBot)
      .on("postgres_changes",{event:"*",schema:"public",table:"bot_outbox"},refreshBot)
      .on("postgres_changes",{event:"*",schema:"public",table:"platform_events"},refreshBot)
      .on("postgres_changes",{event:"*",schema:"public",table:"short_links"},refreshBot)
      .on("postgres_changes",{event:"*",schema:"public",table:"community_quotes"},refreshCommunity)
      .subscribe();
    // Fallback para projetos onde alguma tabela ainda não entrou na publicação
    // Realtime. Mantém o painel atualizado sem recarregar a página.
    const refreshAll=()=>{refreshBot();refreshCommunity();};
    const timer=window.setInterval(refreshAll,30000);
    document.addEventListener("visibilitychange",refreshAll);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refreshAll);void supabase.removeChannel(channel);};
  },[accessState,admin]);

  const channelStatusSignature=botChannels.map((item)=>`${item.platform}:${item.enabled}`).join("|");
  const commandStatusSignature=botCommands.map((item)=>`${item.id}:${item.enabled}`).join("|");
  const automationStatusSignature=botAutomations.map((item)=>`${item.event_key}:${item.enabled}:${item.include_site_link}`).join("|");

  useEffect(()=>{
    if(accessState!=="authorized"||!botChannels.length)return;
    const supabase=getSupabaseBrowserClient();
    void Promise.all(botChannels.map((item)=>supabase.from("bot_channels").update({enabled:item.enabled,connection_status:item.enabled?"configured":"disconnected",updated_at:new Date().toISOString()}).eq("platform",item.platform))).then((results)=>setBotSaveState(results.some(({error})=>error)?"error":"saved"));
  },[channelStatusSignature,accessState,botChannels]);

  useEffect(()=>{
    if(accessState!=="authorized"||!botCommands.length)return;
    const supabase=getSupabaseBrowserClient();
    void Promise.all(botCommands.map((item)=>supabase.from("bot_commands").update({enabled:item.enabled,updated_at:new Date().toISOString()}).eq("id",item.id))).then((results)=>setBotSaveState(results.some(({error})=>error)?"error":"saved"));
  },[commandStatusSignature,accessState,botCommands]);

  useEffect(()=>{
    if(accessState!=="authorized"||!botAutomations.length)return;
    const supabase=getSupabaseBrowserClient();
    void Promise.all(botAutomations.map((item)=>supabase.from("bot_automations").update({enabled:item.enabled,include_site_link:item.include_site_link,updated_at:new Date().toISOString()}).eq("event_key",item.event_key))).then((results)=>setBotSaveState(results.some(({error})=>error)?"error":"saved"));
  },[automationStatusSignature,accessState,botAutomations]);

  const loadIntegrations = async () => {
    const {data}=await getSupabaseBrowserClient().from("platform_integrations").select("platform,status,channel_login,external_user_id,display_name,bot_user_id,bot_login,bot_display_name,scopes,eventsub_status,last_synced_at,last_error").order("platform");
    if(data)setPlatformIntegrations(data as PlatformIntegration[]);
  };
  useEffect(()=>{if(accessState==="authorized"&&admin&&["owner","admin","moderator"].includes(admin.role))void loadIntegrations();},[accessState,admin]);

  const updateHeroField = (field: keyof HeroContent, value: string) => {
    setHeroContent((current) => ({ ...current, [field]: value }));
    setHeroSaveState("idle");
  };

  const handleHeroSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHeroSaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("site_settings").upsert({ key: "hero_content", value: heroContent, is_public: true, updated_at: new Date().toISOString() });
    setHeroSaveState(error ? "error" : "saved");
  };

  const updateProfileItem = (index: number, field: "label" | "value" | "helper_text" | "link_url", value: string) => {
    setProfileItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value || (field === "link_url" ? null : value) } : item));
    setProfileSaveState("idle");
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("profile_items").upsert(profileItems, { onConflict: "item_key" });
    setProfileSaveState(error ? "error" : "saved");
  };

  const updateScheduleEvent = (index:number, field:keyof ScheduleEvent, value:string|boolean) => {
    setScheduleEvents((current) => current.map((item,itemIndex) => itemIndex === index ? { ...item,[field]:value } : item));
    setSavedScheduleIndex(null);
    setScheduleSaveState("idle");
  };

  const notifyLiveContentChange = () => {
    const changedAt=crypto.randomUUID();
    window.localStorage.setItem("thenees-live-content-updated",changedAt);
    if("BroadcastChannel" in window){const channel=new BroadcastChannel("thenees-live-content");channel.postMessage(changedAt);channel.close();}
  };

  const notifyCommunityContentChange=()=>{
    const changedAt=crypto.randomUUID();
    window.localStorage.setItem("thenees-community-content-updated",changedAt);
    if("BroadcastChannel" in window){const channel=new BroadcastChannel("thenees-community-content");channel.postMessage(changedAt);channel.close();}
  };

  const removeScheduleEvent = async (index:number) => {
    const current = scheduleEvents[index];
    if (current?.id && !window.confirm(`Remover a live "${current.title}" da agenda?`)) return;
    if (current?.id) {
      setScheduleSaveState("saving");
      const { error } = await getSupabaseBrowserClient().from("schedule_events").delete().eq("id",current.id);
      if (error) { setScheduleSaveState("error");return; }
    }
    setScheduleEvents((items) => items.filter((_,itemIndex) => itemIndex !== index));
    setScheduleSaveState("saved");
    notifyLiveContentChange();
  };

  const saveScheduleEvent = async (index:number) => {
    const item=scheduleEvents[index];
    if(!item?.starts_at||!item.title.trim())return;
    setSavingScheduleIndex(index);setSavedScheduleIndex(null);setScheduleSaveState("saving");
    const payload={...(item.id?{id:item.id}:{}),starts_at:saoPauloDateTimeInputToIso(item.starts_at),title:item.title.trim(),game:item.game||null,platform:item.platform,description:item.description||null,published:item.published,updated_at:new Date().toISOString()};
    const {data,error}=await getSupabaseBrowserClient().from("schedule_events").upsert(payload).select("id,starts_at,title,game,platform,description,published").single();
    if(error||!data)setScheduleSaveState("error");
    else{setScheduleEvents((items)=>items.map((current,itemIndex)=>itemIndex===index?{...data,starts_at:formatSaoPauloDateTimeInput(data.starts_at),game:data.game??"",description:data.description??""} as ScheduleEvent:current));setScheduleSaveState("saved");setSavedScheduleIndex(index);notifyLiveContentChange();}
    setSavingScheduleIndex(null);
  };

  const handleScheduleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setScheduleSaveState("saving");
    const supabase = getSupabaseBrowserClient();
    if (deletedScheduleIds.length) await supabase.from("schedule_events").delete().in("id",deletedScheduleIds);
    const payload = scheduleEvents.map((item) => ({ ...(item.id ? { id:item.id } : {}), starts_at:saoPauloDateTimeInputToIso(item.starts_at),title:item.title,game:item.game||null,platform:item.platform,description:item.description||null,published:item.published,updated_at:new Date().toISOString() }));
    const scheduleResult = payload.length ? await supabase.from("schedule_events").upsert(payload).select("id,starts_at,title,game,platform,description,published").order("starts_at") : { data:[],error:null };
    const videoPayload = { ...(featuredVideo.id ? { id:featuredVideo.id } : {}),title:featuredVideo.title,video_url:featuredVideo.video_url,thumbnail_url:featuredVideo.thumbnail_url||null,published:featuredVideo.published,sort_order:featuredVideo.sort_order,updated_at:new Date().toISOString() };
    const videoResult = await supabase.from("featured_videos").upsert(videoPayload).select("id,title,video_url,thumbnail_url,published,sort_order").single();
    if (scheduleResult.error || videoResult.error) setScheduleSaveState("error");
    else {
      setScheduleEvents((scheduleResult.data ?? []).map((item) => ({ ...item,starts_at:formatSaoPauloDateTimeInput(item.starts_at),game:item.game??"",description:item.description??"" })) as ScheduleEvent[]);
      if (videoResult.data) setFeaturedVideo({ ...videoResult.data,thumbnail_url:videoResult.data.thumbnail_url??"" } as FeaturedVideo);
      setDeletedScheduleIds([]);
      setScheduleSaveState("saved");
      notifyLiveContentChange();
    }
  };

  const handleContentSave = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setContentSaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("site_settings").upsert({ key:"site_content",value:siteContent,is_public:true,updated_at:new Date().toISOString() });
    setContentSaveState(error?"error":"saved");
  };

  const handleLinksSave = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(!normalizeHttpUrl(officialLinks.community)||officialLinks.channels.some((item)=>!normalizeHttpUrl(item.url))){setLinksSaveState("error");setOfficialPlatformError("REVISE OS ENDEREÇOS DESTACADOS ANTES DE PUBLICAR.");return;}
    setOfficialPlatformError("");setLinksSaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("site_settings").upsert({ key:"official_links",value:officialLinks,is_public:true,updated_at:new Date().toISOString() });
    setLinksSaveState(error?"error":"saved");
    if(!error){const changedAt=Date.now().toString();window.localStorage.setItem("thenees-official-links-updated",changedAt);if("BroadcastChannel" in window){const channel=new BroadcastChannel("thenees-official-links");channel.postMessage(changedAt);channel.close();}}
  };

  const addOfficialChannel = () => {
    const url=normalizeHttpUrl(officialPlatformUrl);
    if(!url){setOfficialPlatformError("INFORME UM ENDEREÇO VÁLIDO, COMO INSTAGRAM.COM/THENEESR.");return;}
    const key=officialPlatform.toLowerCase().replace(" / twitter","") as "twitch"|"kick"|"youtube"|"discord";
    setOfficialLinks((current)=>{
      const channels=[...current.channels.filter((item)=>item.platform!==officialPlatform),{platform:officialPlatform,url}];
      return {...current,channels,...(["twitch","kick","youtube","discord"].includes(key)?{[key]:url}:{})};
    });
    setOfficialPlatformUrl("");setOfficialPlatformError("");setLinksSaveState("idle");
  };

  const handleMetricsSave = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setCommunitySaveState("saving");
    const payload = communityMetrics.map((item) => ({id:item.id,metric_key:item.metric_key,label:item.label,value:item.value,helper_text:item.helper_text||null,source:item.source,is_public:item.is_public,updated_at:new Date().toISOString()}));
    const { error } = await getSupabaseBrowserClient().from("community_metrics").upsert(payload,{onConflict:"metric_key"});
    setCommunitySaveState(error?"error":"saved");
    if(!error)notifyCommunityContentChange();
  };

  const handleQuoteCreate = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setCommunitySaveState("saving");
    const payload = {...quoteDraft,quoted_at:saoPauloDateTimeInputToIso(quoteDraft.quoted_at),approved:quoteDraft.status==="approved",bot_announced_at:quoteDraft.status==="approved"?new Date().toISOString():null};
    const { error } = await getSupabaseBrowserClient().from("community_quotes").insert(payload);
    if (error) setCommunitySaveState("error"); else { setQuoteDraft({...quoteDraft,quote_text:"",author_name:"",quoted_at:formatSaoPauloDateTimeInput(new Date())});setCommunitySaveState("saved");notifyCommunityContentChange();await loadCommunity(); }
  };

  const saveQuote = async (quote:CommunityQuote) => {
    if (!quote.id) return;
    setCommunitySaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("community_quotes").update({quote_text:quote.quote_text.trim(),author_name:quote.author_name.trim(),platform:quote.platform,quoted_at:saoPauloDateTimeInputToIso(formatSaoPauloDateTimeInput(quote.quoted_at)),status:quote.status,approved:quote.status==="approved"}).eq("id",quote.id);
    if (error) setCommunitySaveState("error"); else { setCommunitySaveState("saved");setOpenQuoteId(null);notifyCommunityContentChange();await loadCommunity(); }
  };

  const deleteQuote = async (quote:CommunityQuote) => {
    if (!quote.id || !window.confirm(`Excluir definitivamente a quote #${quote.quote_number ?? "--"}?`)) return;
    setCommunitySaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("community_quotes").delete().eq("id",quote.id);
    if (error) setCommunitySaveState("error"); else { setCommunitySaveState("saved");setOpenQuoteId(null);notifyCommunityContentChange();await loadCommunity(); }
  };

  const updateBirthday = async (player:BirthdayPlayer,changes:Partial<BirthdayPlayer>) => {
    setSavingBirthdayId(player.id);setSavedBirthdayId(null);setCommunitySaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("game_players").update({...changes,updated_at:new Date().toISOString()}).eq("id",player.id);
    if (error) setCommunitySaveState("error"); else { setCommunitySaveState("saved");setSavedBirthdayId(player.id);notifyCommunityContentChange();await loadCommunity();window.setTimeout(()=>setSavedBirthdayId((current)=>current===player.id?null:current),1800); }
    setSavingBirthdayId(null);
  };

  const handleCommercialSave = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();setCommercialSaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("site_settings").upsert({key:"commercial_content",value:commercialContent,is_public:true,updated_at:new Date().toISOString()});
    setCommercialSaveState(error?"error":"saved");
    if(!error){const changedAt=Date.now().toString();window.localStorage.setItem("thenees-commercial-content-updated",changedAt);if("BroadcastChannel" in window){const channel=new BroadcastChannel("thenees-commercial-content");channel.postMessage(changedAt);channel.close();}}
  };

  const updateContactMessage = async (messageItem:ContactMessage,changes:Partial<Pick<ContactMessage,"status"|"admin_notes">>) => {
    setSavingContactId(messageItem.id);setSavedContactId(null);setCommercialSaveState("saving");
    const next = {...changes,updated_at:new Date().toISOString(),...(changes.status==="replied"?{replied_at:new Date().toISOString()}:{})};
    const { error } = await getSupabaseBrowserClient().from("contact_messages").update(next).eq("id",messageItem.id);
    if(error)setCommercialSaveState("error");else{setCommercialSaveState("saved");setSavedContactId(messageItem.id);await loadCommercial();window.setTimeout(()=>setSavedContactId((current)=>current===messageItem.id?null:current),1800);}
    setSavingContactId(null);
  };

  const validateBotCommand=(command:BotCommand,commands=botCommands)=>{
    const issues:string[]=[];
    const normalized=command.command.trim().toLowerCase();
    if(!/^![a-z0-9_]+$/.test(normalized))issues.push("use o formato !nome, sem espaços ou caracteres especiais");
    if(!command.response_template.trim())issues.push("preencha a mensagem de resposta");
    if(!Number.isFinite(command.cooldown_seconds)||command.cooldown_seconds<0||command.cooldown_seconds>3600)issues.push("defina um cooldown entre 0 e 3600 segundos");
    if(commands.some((item)=>item.id!==command.id&&item.command.trim().toLowerCase()===normalized))issues.push("já existe outro comando com esse nome");
    return issues;
  };

  const toggleBotCommand=(command:BotCommand,index:number,enabled:boolean)=>{
    if(enabled){
      const issues=validateBotCommand(command);
      if(issues.length){
        setBotCommandError(`${command.command||"COMANDO"} NÃO PODE SER ATIVADO: ${issues.join("; ").toUpperCase()}.`);
        setOpenBotCommandId(command.id);
        setControlNotice({id:Date.now(),tone:"error",title:"COMANDO INCOMPLETO",message:`Corrija ${issues.length} ${issues.length===1?"pendência":"pendências"} antes de ativar.`});
        return;
      }
    }
    setBotCommandError("");
    setBotCommands((items)=>items.map((item,i)=>i===index?{...item,enabled,approval_status:enabled?"approved":item.approval_status}:item));
  };

  const saveBotCore = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalidCommand=botCommands.find((item)=>validateBotCommand(item).length>0);
    if(invalidCommand){const issues=validateBotCommand(invalidCommand);setBotCommandError(`${invalidCommand.command||"COMANDO"}: ${issues.join("; ").toUpperCase()}.`);setOpenBotCommandId(invalidCommand.id);setBotSaveState("error");return;}
    setBotCommandError("");setBotSaveState("saving");const supabase=getSupabaseBrowserClient();
    const [channels,commands,automations]=await Promise.all([
      supabase.from("bot_channels").upsert(botChannels.map((item)=>({...item,updated_at:new Date().toISOString()}))),
      supabase.from("bot_commands").upsert(botCommands.map((item)=>({...item,description:normalizeUtf8Text(item.description),response_template:normalizeUtf8Text(item.response_template),updated_at:new Date().toISOString()}))),
      supabase.from("bot_automations").upsert(botAutomations.map((item)=>({...item,label:normalizeUtf8Text(item.label),message_template:normalizeUtf8Text(item.message_template),updated_at:new Date().toISOString()}))),
    ]);
    setBotSaveState(channels.error||commands.error||automations.error?"error":"saved");
  };

  const createDynamicBotCommand=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setBotCommandCreateState("saving");
    const command=botCommandDraft.command.trim().toLowerCase();
    const variants=botCommandDraft.responses.map((item)=>item.trim()).filter(Boolean);
    if(!/^![a-z0-9_]+$/.test(command)||!botCommandDraft.description.trim()||(!botCommandDraft.response_template.trim()&&!variants.length)){setBotCommandCreateState("error");return;}
    const supabase=getSupabaseBrowserClient();
    const {data,error}=await supabase.from("bot_commands").insert({command,description:botCommandDraft.description.trim(),response_template:botCommandDraft.response_template.trim()||variants[0],permission:botCommandDraft.permission,command_type:botCommandDraft.command_type,category:botCommandDraft.category,platform_scope:botCommandDraft.platform_scope,cooldown_seconds:botCommandDraft.cooldown_seconds,global_cooldown_seconds:botCommandDraft.global_cooldown_seconds,approval_status:"review",created_by:admin?.display_name,enabled:false,sort_order:botCommands.length+100}).select("*").single();
    if(error||!data){setBotCommandCreateState("error");return;}
    if(variants.length&&["random","eight_ball"].includes(botCommandDraft.command_type))await supabase.from("bot_command_responses").insert(variants.map((response_template,index)=>({command_id:data.id,response_template,weight:1,sort_order:index+1})));
    if(botCommandDraft.command_type==="counter")await supabase.from("bot_counters").insert({counter_key:command.slice(1),label:botCommandDraft.description.trim(),increment_message:botCommandDraft.response_template.trim()||"{{label}}: {{value}}",display_message:botCommandDraft.response_template.trim()||"{{label}}: {{value}}"});
    setBotCommands((items)=>[...items,data as BotCommand]);setBotCommandCreateState("saved");setBotCommandDraft((item)=>({...item,command:"!",description:"",response_template:"",responses:[""]}));
  };

  const updateAutomationOption = async (automation:BotAutomation, field:"enabled"|"include_site_link", value:boolean) => {
    setBotAutomations((items)=>items.map((item)=>item.event_key===automation.event_key?{...item,[field]:value}:item));
    setBotSaveState("saving");
    const {error}=await getSupabaseBrowserClient().from("bot_automations").update({[field]:value,updated_at:new Date().toISOString()}).eq("event_key",automation.event_key);
    if(error){setBotAutomations((items)=>items.map((item)=>item.event_key===automation.event_key?automation:item));setBotSaveState("error");}
    else setBotSaveState("saved");
  };

  const createSpecialViewerMessage=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const username=specialViewerDraft.username.trim().replace(/^@/,"").toLowerCase();
    const messageTemplate=specialViewerDraft.message_template.trim();
    if(!username||!messageTemplate){setSpecialViewerState("error");return;}
    setSpecialViewerState("saving");
    const {data,error}=await getSupabaseBrowserClient().from("bot_viewer_messages").upsert({platform:specialViewerDraft.platform,username,display_name:specialViewerDraft.display_name.trim()||username,message_template:messageTemplate,enabled:true,created_by:admin?.display_name,updated_at:new Date().toISOString()},{onConflict:"platform,username"}).select("id,platform,username,display_name,message_template,enabled,created_at,updated_at").single();
    if(error||!data){setSpecialViewerState("error");return;}
    setSpecialViewerMessages((items)=>[data as SpecialViewerMessage,...items.filter((item)=>item.id!==data.id)]);setViewerSearch("");setSpecialViewerDraft((item)=>({...item,username:"",display_name:"",message_template:"@{{display_name}}, o chat ficou oficialmente melhor agora que você chegou."}));setSpecialViewerState("saved");
  };

  const updateSpecialViewerMessage=async(message:SpecialViewerMessage,changes:Partial<Pick<SpecialViewerMessage,"message_template"|"enabled">>)=>{
    const next={...message,...changes,updated_at:new Date().toISOString()};setSpecialViewerMessages((items)=>items.map((item)=>item.id===message.id?next:item));setSpecialViewerState("saving");
    const {error}=await getSupabaseBrowserClient().from("bot_viewer_messages").update({...changes,updated_at:next.updated_at}).eq("id",message.id);
    if(error){setSpecialViewerMessages((items)=>items.map((item)=>item.id===message.id?message:item));setSpecialViewerState("error");}else setSpecialViewerState("saved");
  };

  const deleteSpecialViewerMessage=async(message:SpecialViewerMessage)=>{
    if(!window.confirm(`Remover a mensagem especial de @${message.username}?`))return;
    const {error}=await getSupabaseBrowserClient().from("bot_viewer_messages").delete().eq("id",message.id);
    if(error)setSpecialViewerState("error");else{setSpecialViewerMessages((items)=>items.filter((item)=>item.id!==message.id));setOpenSpecialViewerId(null);setSpecialViewerState("saved");}
  };

  const persistShortLinks = async (next:ShortLink[]) => {
    setShortLinks(next);setShortLinkState("saving");
    const supabase=getSupabaseBrowserClient();
    const removed=shortLinks.filter((item)=>!next.some((candidate)=>candidate.id===item.id)).map((item)=>item.id);
    const payload=next.map((item)=>({id:item.id,slug:item.slug,label:item.label,destination_url:item.destinationUrl,active:item.active,created_at:item.createdAt,updated_at:new Date().toISOString()}));
    const [saved,deleted]=await Promise.all([payload.length?supabase.from("short_links").upsert(payload):Promise.resolve({error:null}),removed.length?supabase.from("short_links").delete().in("id",removed):Promise.resolve({error:null})]);
    const error=saved.error||deleted.error;
    if(error)setShortLinks(shortLinks);
    setShortLinkState(error?"error":"saved");
    return !error;
  };

  const createShortLink = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug=shortLinkDraft.slug.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"");
    if(!slug||shortLinks.some((item)=>item.slug===slug)){setShortLinkState("error");return;}
    const rawDestination=shortLinkDraft.destinationUrl.trim();
    const destinationUrl=/^https?:\/\//i.test(rawDestination)?rawDestination:`https://${rawDestination}`;
    try{const parsed=new URL(destinationUrl);if(!["http:","https:"].includes(parsed.protocol)||!parsed.hostname)throw new Error("invalid-url");}catch{setShortLinkState("error");return;}
    const next=[{id:crypto.randomUUID(),slug,label:shortLinkDraft.label.trim()||slug,destinationUrl,active:true,createdAt:new Date().toISOString()},...shortLinks];
    if(await persistShortLinks(next))setShortLinkDraft({label:"",slug:"",destinationUrl:""});
  };

  const retryBotItem = async (item:BotOutboxItem) => {
    setBotSaveState("saving");const {error}=await getSupabaseBrowserClient().from("bot_outbox").update({status:"pending",attempts:0,last_error:null,available_at:new Date().toISOString()}).eq("id",item.id);
    if(error)setBotSaveState("error");else{setBotSaveState("saved");await loadBotCore();}
  };

  const queueBirthdays = async () => { if(!window.confirm("Enfileirar agora as mensagens de aniversário de hoje?"))return;setBotSaveState("saving");const {error}=await getSupabaseBrowserClient().rpc("queue_today_birthdays");if(error)setBotSaveState("error");else{setBotSaveState("saved");await loadBotCore();} };

  const connectTwitch = async () => {
    setIntegrationMessage("PREPARANDO AUTORIZAÇÃO TWITCH...");
    const {data,error}=await getSupabaseBrowserClient().functions.invoke("twitch-oauth-start");
    if(error||!data?.url)setIntegrationMessage(data?.error==="twitch_secrets_missing"?"CONFIGURE O CLIENT ID E O CLIENT SECRET DA TWITCH NAS FUNÇÕES DO SUPABASE.":"NÃO FOI POSSÍVEL INICIAR A AUTORIZAÇÃO.");else window.location.assign(data.url);
  };
  const connectKick = async () => {
    setIntegrationMessage("PREPARANDO AUTORIZAÇÃO KICK...");
    const {data,error}=await getSupabaseBrowserClient().functions.invoke("kick-oauth-start");
    if(error||!data?.url)setIntegrationMessage(data?.error==="kick_secrets_missing"?"CONFIGURE O CLIENT ID, CLIENT SECRET E A URL DE RETORNO DA KICK NO SUPABASE.":"NÃO FOI POSSÍVEL INICIAR A AUTORIZAÇÃO KICK.");else window.location.assign(data.url);
  };
  const subscribeTwitch = async () => { if(!window.confirm("Criar ou renovar agora as inscrições EventSub da Twitch?"))return;setIntegrationMessage("CRIANDO INSCRIÇÕES EVENTSUB...");const {data,error}=await getSupabaseBrowserClient().functions.invoke("twitch-subscribe");setIntegrationMessage(error||data?.error?"NÃO FOI POSSÍVEL ATIVAR TODOS OS EVENTOS.":"EVENTOS TWITCH ENVIADOS PARA VALIDAÇÃO.");await loadIntegrations(); };
  const testTwitchWorker = async () => { if(!window.confirm("Processar agora os eventos pendentes da fila Twitch?"))return;setIntegrationMessage("PROCESSANDO FILA TWITCH...");const {data,error}=await getSupabaseBrowserClient().functions.invoke("twitch-worker");setIntegrationMessage(error||data?.error?"WORKER TWITCH INDISPONÍVEL OU SEM AUTORIZAÇÃO.":`${data.processed} EVENTOS PROCESSADOS.`);await loadBotCore(); };
  const subscribeKick = async () => { if(!window.confirm("Ativar agora chat, follows e inscrições da Kick?"))return;setIntegrationMessage("ATIVANDO EVENTOS KICK...");const {data,error}=await getSupabaseBrowserClient().functions.invoke("kick-subscribe");setIntegrationMessage(error||data?.error?"NÃO FOI POSSÍVEL ATIVAR OS EVENTOS KICK.":"EVENTOS KICK ATIVADOS.");await loadIntegrations(); };
  const testKickWorker = async () => { setIntegrationMessage("PROCESSANDO FILA KICK...");const {data,error}=await getSupabaseBrowserClient().functions.invoke("kick-worker");setIntegrationMessage(error||data?.error?"WORKER KICK INDISPONÍVEL OU SEM AUTORIZAÇÃO.":`${data.processed} EVENTOS KICK PROCESSADOS.`);await loadBotCore(); };
  const disconnectIntegration = async (platform:"TWITCH"|"KICK") => { if(!window.confirm(`Desconectar ${platform} do ArrobaSrv? Os eventos deixarão de ser recebidos.`))return;setIntegrationMessage(`DESCONECTANDO ${platform}...`);const {error}=await getSupabaseBrowserClient().functions.invoke("platform-disconnect",{body:{platform}});setIntegrationMessage(error?"NÃO FOI POSSÍVEL DESCONECTAR.":`${platform} DESCONECTADA.`);await loadIntegrations();await loadBotCore(); };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setAccessState("checking");
    const { data, error } = authMode === "register"
      ? await getSupabaseBrowserClient().auth.signUp({ email,password,options:{ emailRedirectTo:`${window.location.origin}/control` } })
      : await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    if (error) {
      setAccessState("signed_out");
      setMessage(authMode === "register" ? "Não foi possível criar o acesso. Confirme se o convite usa este e-mail." : "E-mail ou senha inválidos para o Thenees Control.");
    } else if (authMode === "register" && !data.session) {
      setAccessState("signed_out");
      setMessage("Conta criada. Confirme o link enviado ao e-mail e depois entre no Control.");
    }
    setPassword("");
  };

  const handleInvite = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail=inviteEmail.trim().toLowerCase();
    if(teamMembers.some((member)=>member.email.toLowerCase()===normalizedEmail)){setTeamMessage("ESTE E-MAIL JÁ POSSUI ACESSO À EQUIPE.");return;}
    setTeamMessage("ENVIANDO CONVITE...");
    const { data:userData } = await getSupabaseBrowserClient().auth.getUser();
    const { error } = await getSupabaseBrowserClient().from("admin_invites").insert({ email:normalizedEmail,role:inviteRole,invited_by:userData.user?.id });
    if (error) setTeamMessage(error.code === "23505" ? "JÁ EXISTE UM CONVITE ATIVO PARA ESTE E-MAIL." : "NÃO FOI POSSÍVEL CRIAR O CONVITE.");
    else { setTeamMessage("CONVITE CRIADO. ENVIE O LINK /CONTROL PARA A PESSOA.");setInviteEmail("");await loadTeam(); }
  };

  const updateMember = async (member:TeamMember, changes:Partial<Pick<TeamMember,"role"|"active">>) => {
    if(!admin||member.user_id===admin.user_id||member.role==="owner"||(changes.role==="owner"&&admin.role!=="owner")){setTeamMessage("ESSA ALTERAÇÃO É PROTEGIDA.");return;}
    const action=changes.active===false?`Suspender o acesso de ${member.display_name}?`:changes.active===true?`Reativar o acesso de ${member.display_name}?`:changes.role?`Alterar ${member.display_name} para ${changes.role.toUpperCase()}?`:"Confirmar alteração?";
    if(!window.confirm(action))return;
    setTeamMessage("ATUALIZANDO EQUIPE...");
    const { error } = await getSupabaseBrowserClient().from("admin_users").update({ ...changes,updated_at:new Date().toISOString() }).eq("user_id",member.user_id);
    setTeamMessage(error ? "NÃO FOI POSSÍVEL ATUALIZAR O ACESSO." : "ACESSO ATUALIZADO.");
    if (!error) await loadTeam();
  };

  const closeInvite = async (invite:TeamInvite) => {
    if(!invite.active||invite.accepted_at||!window.confirm(`Encerrar o convite enviado para ${invite.email}?`))return;
    setTeamMessage("ENCERRANDO CONVITE...");
    const {error}=await getSupabaseBrowserClient().from("admin_invites").update({active:false}).eq("id",invite.id);
    setTeamMessage(error?"NÃO FOI POSSÍVEL ENCERRAR O CONVITE.":"CONVITE ENCERRADO.");
    if(!error)await loadTeam();
  };

  const handleSignOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    setAdmin(null);
    setAccessState("signed_out");
  };

  const handlePasswordRecovery = async () => {
    if (!email) {
      setMessage("Informe seu e-mail para receber o link de acesso.");
      return;
    }
    setMessage("Enviando link seguro...");
    const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/control/setup-password`,
    });
    setMessage(error ? "Não foi possível enviar o link. Tente novamente." : "Link enviado. Confira seu e-mail e a caixa de spam.");
  };

  if (accessState !== "authorized") {
    return <main className="control-auth">
      <section className="control-login" aria-labelledby="control-login-title">
        <div className="control-login-brand">THENEES<span>°</span> CONTROL</div>
        <div className="control-login-status"><i /> ACESSO RESTRITO / ADMIN</div>
        <h1 id="control-login-title">CONTROLE O<br /><em>CAOS.</em></h1>
        <p>Entre com o usuário administrativo criado no Supabase Auth. A conta do painel do Supabase não é utilizada aqui.</p>
        {accessState === "setup_required" ? <div className="control-setup"><b>SISTEMA AGUARDANDO BANCO</b><span>Execute a migração inicial e cadastre o primeiro administrador.</span></div> : <form onSubmit={handleLogin}>
          <label>E-MAIL<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="ADMIN@THENEES.COM.BR" /></label>
          <label>SENHA<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required placeholder="••••••••••••" /></label>
          {message && <div className="control-error" role="alert">{message}</div>}
          <button type="submit" disabled={accessState === "checking"}>{accessState === "checking" ? "VERIFICANDO..." : authMode === "register" ? "CRIAR ACESSO CONVIDADO →" : "ENTRAR NO CONTROL →"}</button>
          <button className="control-recovery" type="button" onClick={() => { setAuthMode((current) => current === "login" ? "register" : "login");setMessage(""); }}>{authMode === "login" ? "RECEBI UM CONVITE / CRIAR CONTA" : "JÁ TENHO CONTA / ENTRAR"}</button>
          <button className="control-recovery" type="button" onClick={handlePasswordRecovery}>DEFINIR OU RECUPERAR SENHA</button>
        </form>}
        {accessState === "setup_required" && message && <div className="control-error" role="status">{message}</div>}
        <a href="/">← VOLTAR PARA O SITE</a>
      </section>
      <aside className="control-login-visual" aria-hidden="true"><span>SYS_01</span><b>ALL<br />SYSTEMS<br /><em>READY.</em></b><div>DATABASE <i /> READY</div><div>AUTH <i /> READY</div><div>PUBLIC SITE <i /> ONLINE</div></aside>
    </main>;
  }

  const selectedGroup = navigationGroups.find((group) => selectedArea.startsWith(`${group.number}-`));
  const selectedItem = selectedGroup?.items.find(([number]) => selectedArea === `${selectedGroup.number}-${number}`);
  const allowedAreas=roleAreas[admin?.role??""]??[];
  const visibleGroups=navigationGroups.map((group)=>({...group,items:group.items.filter(([number])=>allowedAreas.includes(`${group.number}-${number}`))})).filter((group)=>group.items.length>0);
  const requestAreaChange=(nextArea:string)=>{if(nextArea===selectedArea)return;if(dirtyForms.size>0&&!window.confirm("Existem alterações não salvas. Deseja sair desta área e descartá-las?"))return;setDirtyForms(new Set());setSelectedArea(nextArea)};
  const twitchIntegration=platformIntegrations.find((item)=>item.platform==="TWITCH");
  const kickIntegrationStored=platformIntegrations.find((item)=>item.platform==="KICK");
  const hasStaleKickDelivery=botOutbox.some((item)=>item.status==="pending"&&["KICK","BOTH"].includes(item.target_platform)&&Date.now()-new Date(item.created_at).getTime()>120000);
  const kickIntegration=kickIntegrationStored&&hasStaleKickDelivery?{...kickIntegrationStored,status:"error",eventsub_status:"degraded",last_error:"OAuth conectado, mas existem entregas da Kick sem confirmação."}:kickIntegrationStored;
  const recentControlActivity=[
    ...contactMessages.slice(0,4).map((item)=>({id:`message-${item.id}`,kind:"MENSAGEM",label:item.subject,detail:`${item.sender_name} · ${item.status.toUpperCase()}`,date:item.created_at,area:"05-03"})),
    ...botOutbox.slice(0,4).map((item)=>({id:`bot-${item.id}`,kind:"ARROBASRV",label:item.event_key,detail:`${item.target_platform} · ${item.status.toUpperCase()}`,date:item.created_at,area:"03-03"})),
    ...scheduleEvents.filter((item)=>item.id).slice(0,4).map((item)=>({id:`schedule-${item.id}`,kind:"AGENDA",label:item.title,detail:`${item.platform} · ${item.published?"PUBLICADA":"RASCUNHO"}`,date:new Date(item.starts_at).toISOString(),area:"01-03"})),
  ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,6);
  const indexedSchedule=scheduleEvents.map((item,index)=>({item,index,isPast:new Date(item.starts_at).getTime()<Date.now()}));
  const upcomingScheduleCount=indexedSchedule.filter(({isPast})=>!isPast).length;
  const pastScheduleCount=indexedSchedule.filter(({isPast})=>isPast).length;
  const visibleSchedule=indexedSchedule.filter(({isPast})=>scheduleFilter==="all"||(scheduleFilter==="past"?isPast:!isPast));
  const visibleQuotes=communityQuotes.map((quote,index)=>({quote,index})).filter(({quote})=>`${quote.quote_number??""} ${quote.quote_text} ${quote.author_name}`.toLowerCase().includes(quoteSearch.toLowerCase())&&(quoteFilter==="all"||quote.status===quoteFilter));
  const visibleBotCommands=botCommands.map((command,index)=>({command,index})).filter(({command})=>`${command.command} ${command.description} ${command.response_template}`.toLowerCase().includes(botCommandSearch.toLowerCase())&&(botCommandFilter==="all"||(botCommandFilter==="active"?command.enabled:!command.enabled)));
  const visibleAutomations=botAutomations.map((automation,index)=>({automation,index})).filter(({automation})=>automationFilter==="all"||(automationFilter==="active"?automation.enabled:!automation.enabled));
  const visibleOutbox=botOutbox.filter((item)=>outboxFilter==="all"||item.status===outboxFilter);
  const visibleShortLinks=shortLinks.filter((item)=>`${item.label} ${item.slug} ${item.destinationUrl}`.toLowerCase().includes(shortLinkSearch.toLowerCase()));
  const visibleBirthdayPlayers=birthdayPlayers.filter((player)=>`${player.display_name??""} ${player.username} ${player.platform}`.toLowerCase().includes(birthdaySearch.toLowerCase())&&(birthdayFilter==="all"||(birthdayFilter==="enabled"?player.birthday_party_enabled:!player.birthday_party_enabled)));
  const visibleContactMessages=contactMessages.filter((item)=>`${item.sender_name} ${item.sender_email} ${item.company??""} ${item.subject} ${item.message}`.toLowerCase().includes(contactSearch.toLowerCase())&&(contactFilter==="all"||item.status===contactFilter));
  const visiblePartners=commercialContent.partners.map((partner,index)=>({partner,index})).filter(({partner})=>partner.name.toLowerCase().includes(partnerSearch.toLowerCase())&&(partnerFilter==="all"||(partnerFilter==="visible"?partner.active:!partner.active)));
  const visibleTeamMembers=teamMembers.filter((member)=>`${member.display_name} ${member.email} ${member.role}`.toLowerCase().includes(teamSearch.toLowerCase())&&(teamFilter==="all"||(teamFilter==="active"?member.active:!member.active)));
  const visibleBackendTables=backendTables.filter((item)=>`${item.label} ${item.table}`.toLowerCase().includes(backendSearch.toLowerCase()));
  const visibleModeratorCommands=moderatorCommandGuides.filter((item)=>`${item.syntax} ${item.description} ${item.category}`.toLowerCase().includes(moderatorCommandSearch.toLowerCase())&&(moderatorCommandCategory==="all"||item.category===moderatorCommandCategory));
  const viewerSuggestions=viewerSearch.trim()?viewerCandidates.filter((item)=>`${item.username} ${item.display_name??""}`.toLowerCase().includes(viewerSearch.trim().toLowerCase())).slice(0,8):viewerCandidates.slice(0,5);
  const renderSpecialViewerMessages=()=> <section className="control-special-viewers"><header><div><small>SAUDAÇÕES PERSONALIZADAS</small><b>MENSAGENS ESPECIAIS POR VIEWER</b><p>Busque alguém que já apareceu no chat e defina uma mensagem exclusiva para a primeira participação do dia.</p></div><span>{specialViewerMessages.filter((item)=>item.enabled).length} ATIVAS</span></header><form data-control-form="special-viewer" onSubmit={createSpecialViewerMessage}><label className="control-viewer-search">BUSCAR VIEWER<input value={viewerSearch} onChange={(event)=>{setViewerSearch(event.target.value);setSpecialViewerDraft((item)=>({...item,username:event.target.value.replace(/^@/,"")}))}} placeholder="DIGITE O NOME OU @USUÁRIO" />{viewerSearch&&<div>{viewerSuggestions.length===0?<span>NENHUM USUÁRIO ENCONTRADO. VOCÊ AINDA PODE CADASTRAR MANUALMENTE.</span>:viewerSuggestions.map((viewer)=><button type="button" key={`${viewer.platform}-${viewer.username}`} onClick={()=>{setViewerSearch(viewer.display_name||viewer.username);setSpecialViewerDraft((item)=>({...item,platform:viewer.platform,username:viewer.username,display_name:viewer.display_name||viewer.username}))}}><b>{viewer.display_name||viewer.username}</b><small>@{viewer.username} · {viewer.platform}</small></button>)}</div>}</label><label>PLATAFORMA<select value={specialViewerDraft.platform} onChange={(event)=>setSpecialViewerDraft((item)=>({...item,platform:event.target.value as "TWITCH"|"KICK"}))}><option>TWITCH</option><option>KICK</option></select></label><label className="wide">MENSAGEM ESPECIAL<textarea maxLength={500} value={specialViewerDraft.message_template} onChange={(event)=>setSpecialViewerDraft((item)=>({...item,message_template:event.target.value}))} placeholder="@{{display_name}}, sua mensagem especial..." /></label><aside><span>VARIÁVEIS: <code>{"{{display_name}}"}</code> <code>{"{{username}}"}</code></span>{specialViewerState==="error"&&<em className="error">NÃO FOI POSSÍVEL SALVAR. CONFIRA O USUÁRIO E TENTE NOVAMENTE.</em>}{specialViewerState==="saved"&&<em className="saved">MENSAGEM ESPECIAL SALVA.</em>}<button type="submit" disabled={specialViewerState==="saving"}>{specialViewerState==="saving"?"SALVANDO...":"ADICIONAR MENSAGEM →"}</button></aside></form><div className="control-special-viewer-list">{specialViewerMessages.length===0?<div className="control-community-empty">NENHUMA MENSAGEM ESPECIAL CADASTRADA.</div>:specialViewerMessages.map((message)=>{const isOpen=openSpecialViewerId===message.id;return <article className={isOpen?"open":""} key={message.id}><div><label className="control-command-switch"><em className="control-visually-hidden">ATIVAR MENSAGEM ESPECIAL</em><input type="checkbox" checked={message.enabled} onChange={(event)=>void updateSpecialViewerMessage(message,{enabled:event.target.checked})} /><span /></label><button type="button" onClick={()=>setOpenSpecialViewerId(isOpen?null:message.id)}><b>{message.display_name||message.username}</b><small>@{message.username} · {message.platform}</small><em>{message.message_template}</em><i /></button></div>{isOpen&&<fieldset><label className="wide">MENSAGEM<textarea maxLength={500} value={message.message_template} onChange={(event)=>setSpecialViewerMessages((items)=>items.map((item)=>item.id===message.id?{...item,message_template:event.target.value}:item))} onBlur={(event)=>void updateSpecialViewerMessage(message,{message_template:event.target.value.trim()})} /></label><button className="danger" type="button" onClick={()=>void deleteSpecialViewerMessage(message)}>REMOVER MENSAGEM</button></fieldset>}</article>})}</div></section>;
  const stalePendingCount=botOutbox.filter((item)=>item.status==="pending"&&Date.now()-new Date(item.created_at).getTime()>120000).length;
  const kickDeliveryDegraded=kickIntegrationStored?.status==="connected"&&hasStaleKickDelivery;

  return <main className={`control-dashboard control-dashboard-v2${stalePendingCount>0||kickDeliveryDegraded?" has-operational-alert":""}`}>
    <header><div className="control-login-brand">THENEES<span>°</span> CONTROL</div><div className="control-user-area">{dirtyForms.size>0&&<span className="control-unsaved-status"><i /> {dirtyForms.size} ALTERAÇÃO{dirtyForms.size>1?"ÕES":""} PENDENTE{dirtyForms.size>1?"S":""}</span>}<div className="control-user-copy"><b>{admin?.display_name}</b><small>{admin?.role} / ACESSO ATIVO</small></div><span><i /> SISTEMA CONECTADO</span><button type="button" onClick={handleSignOut}>SAIR</button></div></header>
    {controlNotice&&<aside className={`control-notice ${controlNotice.tone}`} role={controlNotice.tone==="error"?"alert":"status"} aria-live="polite"><i /><div><small>{controlNotice.tone==="saving"?"PROCESSANDO":controlNotice.tone==="success"?"CONCLUÍDO":"ATENÇÃO"}</small><b>{controlNotice.title}</b><span>{controlNotice.message}</span></div>{controlNotice.tone!=="saving"&&<button type="button" aria-label="Fechar notificação" onClick={()=>setControlNotice(null)}>×</button>}</aside>}
    {(stalePendingCount>0||kickDeliveryDegraded)&&<div className="control-operational-alert" role="status"><b>ATENÇÃO OPERACIONAL</b><span>{stalePendingCount>0?`${stalePendingCount} entrega${stalePendingCount>1?"s":""} permanece${stalePendingCount>1?"m":""} pendente${stalePendingCount>1?"s":""}.`:""} {kickDeliveryDegraded?"A KICK ESTÁ CONECTADA, MAS A ENTREGA DE EVENTOS ESTÁ DEGRADADA.":""}</span><button type="button" onClick={()=>requestAreaChange("03-03")}>VER FILA →</button></div>}
    <aside className="control-sidebar">
      <div className="control-sidebar-intro"><small>PAINEL DE CONTROLE</small><b>ORGANIZE O CAOS.</b></div>
      <nav aria-label="Áreas administrativas">
        {visibleGroups.map((group) => <section className={selectedArea.startsWith(`${group.number}-`) ? "active" : ""} key={group.number}>
          <button className="control-nav-category" type="button" disabled={group.items.every(([number])=>unavailableControlAreas.has(`${group.number}-${number}`))} onClick={() => {const firstAvailable=group.items.find(([number])=>!unavailableControlAreas.has(`${group.number}-${number}`));if(firstAvailable)requestAreaChange(`${group.number}-${firstAvailable[0]}`)}}><span>{group.number}</span><b>{group.title}</b><i>{group.items.every(([number])=>unavailableControlAreas.has(`${group.number}-${number}`))?"EM BREVE":selectedArea.startsWith(`${group.number}-`) ? "−" : "+"}</i></button>
          <div className="control-nav-children">{group.items.map(([number, title]) => {const area=`${group.number}-${number}`;const unavailable=unavailableControlAreas.has(area);return <button className={`${selectedArea === area ? "selected " : ""}${unavailable?"unavailable":""}`} type="button" disabled={unavailable} onClick={() => requestAreaChange(area)} key={area}><span>{number}</span>{title}{unavailable&&<small>EM BREVE</small>}</button>})}</div>
        </section>)}
      </nav>
      <footer className="control-sidebar-footer">
        <div className="control-sidebar-footer-brand"><small>THENEES / ADMIN OS</small><b>CONTROL<span>_</span></b></div>
        <div className="control-sidebar-footer-status"><i /><span>ONLINE</span></div>
        <a href="/" target="_blank" rel="noreferrer"><span>ABRIR SITE PÚBLICO</span><b>↗</b></a>
        <div className="control-sidebar-footer-meta"><span>SYS.01</span><span>ARROBASRV READY</span><span>2026</span></div>
      </footer>
    </aside>
    <section className="control-workspace" onInputCapture={(event)=>{const target=event.target as HTMLElement;if(target.matches('[placeholder^="PESQUISAR"],[placeholder^="BUSCAR"]'))return;const form=target.closest<HTMLFormElement>("form[data-control-form]");if(form?.dataset.controlForm)markFormDirty(form.dataset.controlForm)}} onChangeCapture={(event)=>{const target=event.target as HTMLElement;if(target.matches('[aria-label^="Filtrar"]'))return;const form=target.closest<HTMLFormElement>("form[data-control-form]");if(form?.dataset.controlForm)markFormDirty(form.dataset.controlForm)}}>
      {selectedArea === "00-01" && <section className="control-command" aria-labelledby="command-title">
        <div className="control-command-heading"><div><small>00 / CENTRAL DE COMANDO</small><h1 id="command-title">BEM-VINDO AO<br /><em>THENEES CONTROL.</em></h1><p>Visão rápida do ecossistema, atividades da comunidade e sistemas que precisam da sua atenção.</p></div><div className="control-command-clock"><span>ACESSO</span><b>{admin?.role.toUpperCase()}</b><small>SESSÃO PROTEGIDA</small></div></div>
        <nav className="control-quick-actions" aria-label="Ações rápidas"><span>AÇÕES RÁPIDAS</span><button type="button" onClick={()=>requestAreaChange("01-03")}>+ AGENDAR LIVE</button><button type="button" onClick={()=>requestAreaChange("03-04")}>+ CRIAR LINK</button><button type="button" onClick={()=>requestAreaChange("03-02")}>+ ADICIONAR QUOTE</button><button type="button" onClick={()=>requestAreaChange("05-03")}>ABRIR MENSAGENS</button></nav>
        <div className="control-command-metrics"><button type="button" onClick={()=>requestAreaChange("01-03")}><span>PRÓXIMAS LIVES</span><b>{dashboardStats.schedule ?? "--"}</b><small>ABRIR AGENDA →</small></button><button type="button" onClick={()=>requestAreaChange("03-02")}><span>QUOTES SALVAS</span><b>{dashboardStats.quotes ?? "--"}</b><small>ABRIR ARQUIVO →</small></button><button type="button" className={(dashboardStats.messages ?? 0) > 0 ? "attention" : ""} onClick={()=>requestAreaChange("05-03")}><span>NOVAS MENSAGENS</span><b>{dashboardStats.messages ?? "--"}</b><small>ABRIR CAIXA →</small></button><button type="button" onClick={()=>requestAreaChange("01-02")}><span>ITENS DO PERFIL</span><b>{dashboardStats.profile ?? "--"}</b><small>EDITAR CONTEÚDO →</small></button><article><span>JOGADORES CADASTRADOS</span><b>{dashboardStats.players ?? "--"}</b><small>CHATBATTLE / SOMENTE LEITURA</small></article><article className={(dashboardStats.activePlayers ?? 0) > 0 ? "attention" : ""}><span>JOGANDO AGORA</span><b>{dashboardStats.activePlayers ?? "--"}</b><small>CHATBATTLE / SOMENTE LEITURA</small></article></div>
        <div className="control-command-grid">
          <section className="control-system-board"><header><b>STATUS DOS SISTEMAS</b><button type="button" onClick={()=>requestAreaChange("06-02")}>GERENCIAR →</button></header><div className="control-system-row online"><i /><span><b>SITE PÚBLICO</b><small>Landing e conteúdo editorial</small></span><strong>ONLINE</strong></div><div className="control-system-row online"><i /><span><b>SUPABASE</b><small>Banco, autenticação e políticas</small></span><strong>CONECTADO</strong></div><div className={`control-system-row ${twitchIntegration?.status==="connected"?"online":twitchIntegration?.status==="error"?"offline":"pending"}`}><i /><span><b>ARROBASRV / TWITCH</b><small>{twitchIntegration?.display_name||twitchIntegration?.last_error||"Aguardando autorização"}</small></span><strong>{(twitchIntegration?.status||"PENDENTE").toUpperCase()}</strong></div><div className={`control-system-row ${kickIntegration?.status==="connected"?"online":kickIntegration?.status==="error"?"offline":"pending"}`}><i /><span><b>ARROBASRV / KICK</b><small>{kickIntegration?.display_name||kickIntegration?.last_error||"Aguardando autorização"}</small></span><strong>{(kickIntegration?.status||"PENDENTE").toUpperCase()}</strong></div><div className={`control-system-row ${botOutbox.some((item)=>item.status==="failed")?"offline":"online"}`}><i /><span><b>FILA DO ARROBASRV</b><small>{botOutbox.filter((item)=>item.status==="pending").length} pendentes · {botOutbox.filter((item)=>item.status==="failed").length} falhas</small></span><strong>{botOutbox.some((item)=>item.status==="failed")?"ATENÇÃO":"NORMAL"}</strong></div></section>
          <section className="control-game-board"><header><b>{gameName.toUpperCase()}</b><span>GAME CORE</span></header><div className="control-game-logo">CB<span>_01</span></div><h2>O CHAT É<br />O CONTROLE.</h2><p>A estrutura do game está conectada. Eventos de follow, sub, bits e donate entram na próxima etapa.</p><div><span>AMBIENTE</span><b>DESENVOLVIMENTO</b></div><div><span>BOT ENGINE</span><b className="pending">AGUARDANDO</b></div><div className="control-player-status"><span>PRESENÇA</span><b>{(dashboardStats.activePlayers ?? 0) > 0 ? `${dashboardStats.activePlayers} EM PARTIDA / ONLINE` : "NENHUM JOGADOR ATIVO"}</b></div></section>
          <section className="control-attention-board"><header><b>ATENÇÃO DO ADMIN</b><span>PRIORIDADES ACIONÁVEIS</span></header>{twitchIntegration?.status!=="connected"&&<button type="button" onClick={()=>requestAreaChange("06-02")}><span>01</span><div><b>CONECTAR TWITCH</b><p>Libera eventos, métricas e automações do ArrobaSrv.</p></div></button>}{botOutbox.some((item)=>item.status==="failed")&&<button type="button" onClick={()=>requestAreaChange("03-03")}><span>02</span><div><b>REPROCESSAR FALHAS</b><p>{botOutbox.filter((item)=>item.status==="failed").length} eventos precisam de atenção.</p></div></button>}{scheduleEvents.filter((item)=>item.published).length===0&&<button type="button" onClick={()=>requestAreaChange("01-03")}><span>03</span><div><b>PUBLICAR AGENDA</b><p>Nenhuma transmissão está publicada.</p></div></button>}{twitchIntegration?.status==="connected"&&!botOutbox.some((item)=>item.status==="failed")&&scheduleEvents.some((item)=>item.published)&&<div className="control-attention-clear"><b>NENHUMA PENDÊNCIA CRÍTICA.</b><p>Os sistemas monitorados estão dentro do esperado.</p></div>}</section>
        </div>
        <section className="control-recent-activity"><header><b>ATIVIDADE RECENTE</b><span>AGENDA · MENSAGENS · ARROBASRV</span></header>{recentControlActivity.length===0?<div className="control-attention-clear"><b>NENHUMA ATIVIDADE RECENTE.</b></div>:recentControlActivity.map((item)=><button type="button" key={item.id} onClick={()=>requestAreaChange(item.area)}><span>{item.kind}</span><div><b>{item.label}</b><small>{item.detail}</small></div><time>{new Date(item.date).toLocaleString("pt-BR")}</time><i>→</i></button>)}</section>
      </section>}
      {selectedArea === "01-01" && <section className="control-editor" id="area-01" aria-labelledby="hero-editor-title">
        <div className="control-editor-heading"><div><small>01 / CONTEÚDO DO SITE</small><h2 id="hero-editor-title">EDITOR DA HERO</h2><p>Altere a mensagem principal sem tocar no layout, nos efeitos ou na imagem ASCII.</p></div><span>HOME / PRIMEIRA DOBRA</span></div>
        <form data-control-form="hero" onSubmit={handleHeroSave}>
          <fieldset><legend>IDENTIFICAÇÃO</legend><label>TEXTO SUPERIOR<input value={heroContent.eyebrow} onChange={(event) => updateHeroField("eyebrow", event.target.value)} required /></label><label>VERSÃO<input value={heroContent.version} onChange={(event) => updateHeroField("version", event.target.value)} required /></label></fieldset>
          <fieldset className="control-editor-title-fields"><legend>TÍTULO PRINCIPAL</legend><label>LINHA 01<input value={heroContent.titleLine1} onChange={(event) => updateHeroField("titleLine1", event.target.value)} required /></label><label>LINHA 02 — INÍCIO<input value={heroContent.titleLine2Lead} onChange={(event) => updateHeroField("titleLine2Lead", event.target.value)} required /></label><label>LINHA 02 — DESTAQUE<input value={heroContent.titleLine2Accent} onChange={(event) => updateHeroField("titleLine2Accent", event.target.value)} required /></label><label>LINHA 03<input value={heroContent.titleLine3} onChange={(event) => updateHeroField("titleLine3", event.target.value)} required /></label></fieldset>
          <fieldset><legend>APRESENTAÇÃO</legend><label>SUBTÍTULO <small>{heroContent.subtitle.length}/90</small><input maxLength={90} value={heroContent.subtitle} onChange={(event) => updateHeroField("subtitle", event.target.value)} required /></label><label>DESCRIÇÃO <small>{heroContent.description.length}/180</small><input maxLength={180} value={heroContent.description} onChange={(event) => updateHeroField("description", event.target.value)} required /></label></fieldset>
          <fieldset className="control-editor-buttons"><legend>BOTÕES</legend><label>BOTÃO PRIMÁRIO<input value={heroContent.primaryLabel} onChange={(event) => updateHeroField("primaryLabel", event.target.value)} required /></label><label>DESTINO<input value={heroContent.primaryHref} onChange={(event) => updateHeroField("primaryHref", event.target.value)} required /></label><label>BOTÃO SECUNDÁRIO<input value={heroContent.secondaryLabel} onChange={(event) => updateHeroField("secondaryLabel", event.target.value)} required /></label><label>DESTINO<input value={heroContent.secondaryHref} onChange={(event) => updateHeroField("secondaryHref", event.target.value)} required /></label></fieldset>
          <div className="control-editor-actions"><p>{heroSaveState === "saved" ? "ALTERAÇÕES PUBLICADAS COM SUCESSO." : heroSaveState === "error" ? "ERRO AO SALVAR. TENTE NOVAMENTE." : "O SITE USA OS ÚLTIMOS DADOS PUBLICADOS."}</p><a href="/#home" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit" disabled={heroSaveState === "saving"}>{heroSaveState === "saving" ? "PUBLICANDO..." : "SALVAR E PUBLICAR →"}</button></div>
        </form>
      </section>}
      {selectedArea === "01-02" && <section className="control-editor control-profile-editor" id="area-01-02" aria-labelledby="profile-editor-title">
        <div className="control-editor-heading"><div><small>01.02 / PÁGINAS E TEXTOS</small><h2 id="profile-editor-title">THENEES_PROFILE.DAT</h2><p>Edite informações pessoais e profissionais mantendo o humor e a identidade do inventário.</p></div><span>{profileItems.length} ITENS ATIVOS</span></div>
        <form data-control-form="content" className="control-content-form" onSubmit={handleContentSave}>
          <div className="control-compact-list-heading"><span>ÁREA</span><span>CONTEÚDO ATUAL</span><span /></div>
          <div className="control-compact-list">{(Object.entries(siteContent) as [keyof SiteContent,string][]).map(([key,value],index) => { const isOpen=openContentKey===key;return <article className={isOpen?"open":""} key={key}><button className="control-compact-summary" type="button" aria-expanded={isOpen} aria-controls={`content-${key}`} onClick={()=>setOpenContentKey(isOpen?null:key)}><small>{String(index+1).padStart(2,"0")}</small><b>{siteContentLabels[key]}</b><span>{value}</span><i className={isOpen?"open":""} aria-hidden="true" /></button>{isOpen&&<div className="control-compact-editor" id={`content-${key}`}><label>TEXTO PUBLICADO <small>{value.length}/500</small><textarea maxLength={500} value={value} onChange={(event) => { setSiteContent((current) => ({ ...current,[key]:event.target.value }));setContentSaveState("idle"); }} required /></label></div>}</article>})}</div>
          <div className="control-editor-actions"><p>{contentSaveState === "saved" ? "TEXTOS PUBLICADOS." : contentSaveState === "error" ? "ERRO AO PUBLICAR TEXTOS." : "ABRA UMA LINHA PARA EDITAR. ESTES TEXTOS APARECEM NAS PRINCIPAIS SEÇÕES DO SITE."}</p><button type="submit" disabled={contentSaveState === "saving"}>{contentSaveState === "saving" ? "PUBLICANDO..." : "SALVAR TEXTOS →"}</button></div>
        </form>
        <form data-control-form="profile" onSubmit={handleProfileSave}>
          <div className="control-profile-divider"><b>ITENS DO PERFIL</b><span>RÓTULO · CONTEÚDO · TEXTO AUXILIAR</span></div>
          <div className="control-compact-list-heading profile"><span>ITEM</span><span>CONTEÚDO ATUAL</span><span /></div>
          <div className="control-compact-list control-profile-list">{profileItems.map((item,index) => { const isOpen=openProfileKey===item.item_key;return <article className={isOpen?"open":""} key={item.item_key}><button className="control-compact-summary" type="button" aria-expanded={isOpen} aria-controls={`profile-${item.item_key}`} onClick={()=>setOpenProfileKey(isOpen?null:item.item_key)}><small>{String(index+1).padStart(2,"0")}</small><b>{item.label}</b><span>{item.value}</span><i className={isOpen?"open":""} aria-hidden="true" /></button>{isOpen&&<fieldset className="control-compact-editor" id={`profile-${item.item_key}`}><label>RÓTULO<input value={item.label} onChange={(event) => updateProfileItem(index,"label",event.target.value)} required /></label><label>CONTEÚDO<input value={item.value} onChange={(event) => updateProfileItem(index,"value",event.target.value)} required /></label><label className="wide">TEXTO AUXILIAR<input value={item.helper_text} onChange={(event) => updateProfileItem(index,"helper_text",event.target.value)} required /></label>{item.item_key === "music" && <label className="wide">LINK EXTERNO<input type="url" value={item.link_url ?? ""} onChange={(event) => updateProfileItem(index,"link_url",event.target.value)} /></label>}</fieldset>}</article>})}</div>
          <div className="control-editor-actions"><p>{profileSaveState === "saved" ? "PERFIL PUBLICADO COM SUCESSO." : profileSaveState === "error" ? "ERRO AO SALVAR O PERFIL." : "A ORDEM DOS ITENS ESTÁ PROTEGIDA NESTA FASE."}</p><a href="/#sobre" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit" disabled={profileSaveState === "saving"}>{profileSaveState === "saving" ? "PUBLICANDO..." : "SALVAR PERFIL →"}</button></div>
        </form>
      </section>}
      {selectedArea === "01-03" && <section className="control-editor control-schedule-editor" aria-labelledby="schedule-editor-title">
        <div className="control-editor-heading"><div><small>01.03 / CONTEÚDO DO SITE</small><h2 id="schedule-editor-title">AGENDA & VÍDEOS</h2><p>Defina o que será transmitido e escolha o vídeo editorial exibido no site.</p></div><span>{scheduleEvents.length} EVENTOS / 01 DESTAQUE</span></div>
        <form data-control-form="schedule" onSubmit={handleScheduleSave}>
          <section className="control-schedule-list"><header><div><b>AGENDA DE TRANSMISSÕES</b><small>FUSO PADRÃO / AMERICA_SAO_PAULO</small></div><button type="button" onClick={() => {setScheduleEvents((items) => [...items,newScheduleEvent()]);setScheduleFilter("upcoming");setSavedScheduleIndex(null)}}>+ ADICIONAR LIVE</button></header><div className="control-schedule-toolbar" aria-label="Filtrar agenda"><button className={scheduleFilter==="upcoming"?"active":""} type="button" onClick={()=>setScheduleFilter("upcoming")}>PRÓXIMAS <b>{upcomingScheduleCount}</b></button><button className={scheduleFilter==="past"?"active":""} type="button" onClick={()=>setScheduleFilter("past")}>ENCERRADAS <b>{pastScheduleCount}</b></button><button className={scheduleFilter==="all"?"active":""} type="button" onClick={()=>setScheduleFilter("all")}>TODAS <b>{scheduleEvents.length}</b></button><span>{scheduleEvents.filter((item)=>item.published).length} PUBLICADAS</span></div>{visibleSchedule.length===0?<div className="control-schedule-empty">NENHUMA LIVE NESTE FILTRO.</div>:visibleSchedule.map(({item,index}) => <article className="control-schedule-row" key={item.id ?? `new-${index}`}><div className="control-schedule-index">LIVE_{String(index+1).padStart(2,"0")}</div><label>DATA E HORÁRIO<input type="datetime-local" value={item.starts_at} onChange={(event) => updateScheduleEvent(index,"starts_at",event.target.value)} required /></label><label>PLATAFORMA<select value={item.platform} onChange={(event) => updateScheduleEvent(index,"platform",event.target.value)}><option>TWITCH</option><option>KICK</option><option>TWITCH + KICK</option></select></label><label>TÍTULO <small>{item.title.length}/90</small><input maxLength={90} value={item.title} onChange={(event) => updateScheduleEvent(index,"title",event.target.value)} required /></label><label>JOGO<input maxLength={60} value={item.game} onChange={(event) => updateScheduleEvent(index,"game",event.target.value)} /></label><label className="wide">DESCRIÇÃO <small>{item.description.length}/180</small><input maxLength={180} value={item.description} onChange={(event) => updateScheduleEvent(index,"description",event.target.value)} /></label><label className="control-check"><input type="checkbox" checked={item.published} onChange={(event) => updateScheduleEvent(index,"published",event.target.checked)} /> PUBLICAR NO SITE</label><div className="control-schedule-actions"><button className="control-remove" type="button" onClick={() => void removeScheduleEvent(index)}>REMOVER</button><button className="control-save-live" type="button" disabled={savingScheduleIndex===index} onClick={() => void saveScheduleEvent(index)}>{savingScheduleIndex===index?"SALVANDO...":savedScheduleIndex===index?"LIVE SALVA ✓":"SALVAR LIVE →"}</button></div></article>)}</section>
          <fieldset className="control-video-fields"><legend>VÍDEO EM DESTAQUE</legend><label>TÍTULO<input value={featuredVideo.title} onChange={(event) => setFeaturedVideo((item) => ({ ...item,title:event.target.value }))} required /></label><label>LINK DO YOUTUBE<input type="url" value={featuredVideo.video_url} onChange={(event) => setFeaturedVideo((item) => ({ ...item,video_url:event.target.value }))} required /></label><label className="wide">CAPA PERSONALIZADA <small>OPCIONAL; SE VAZIO, O YOUTUBE SERÁ USADO</small><input type="url" value={featuredVideo.thumbnail_url} onChange={(event) => setFeaturedVideo((item) => ({ ...item,thumbnail_url:event.target.value }))} /></label><label className="control-check"><input type="checkbox" checked={featuredVideo.published} onChange={(event) => setFeaturedVideo((item) => ({ ...item,published:event.target.checked }))} /> EXIBIR NO SITE</label></fieldset>
          <div className="control-editor-actions"><p>{scheduleSaveState === "saved" ? "AGENDA E VÍDEO PUBLICADOS." : scheduleSaveState === "error" ? "ERRO AO SALVAR. REVISE OS CAMPOS." : "ALTERAÇÕES SÓ APARECEM NO SITE APÓS SALVAR."}</p><a href="/#live" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit" disabled={scheduleSaveState === "saving"}>{scheduleSaveState === "saving" ? "PUBLICANDO..." : "SALVAR AGENDA E VÍDEO →"}</button></div>
        </form>
      </section>}
      {selectedArea === "01-04" && <section className="control-editor control-links-editor" aria-labelledby="links-editor-title"><div className="control-editor-heading"><div><small>01.04 / CONTEÚDO DO SITE</small><h2 id="links-editor-title">LINKS OFICIAIS</h2><p>Escolha a plataforma, informe o endereço e reutilize o canal em toda a landing page.</p></div><span>{String(officialLinks.channels.length).padStart(2,"0")} CANAIS</span></div><form data-control-form="links" onSubmit={handleLinksSave} noValidate><fieldset><legend>ADICIONAR OU ATUALIZAR PLATAFORMA</legend><label>PLATAFORMA<select value={officialPlatform} onChange={(event)=>setOfficialPlatform(event.target.value)}>{officialPlatformOptions.map((platform)=><option key={platform}>{platform}</option>)}</select></label><label>LINK DA PLATAFORMA<input type="text" inputMode="url" value={officialPlatformUrl} onChange={(event)=>{setOfficialPlatformUrl(event.target.value);setOfficialPlatformError("")}} placeholder="instagram.com/theneesr" />{officialPlatformUrl&&normalizeHttpUrl(officialPlatformUrl)&&<small className="control-url-preview">SERÁ SALVO COMO {normalizeHttpUrl(officialPlatformUrl)}</small>}</label><button className="control-add-channel" type="button" onClick={addOfficialChannel}>+ ADICIONAR À LISTA</button>{officialPlatformError&&<p className="control-url-error" role="alert">{officialPlatformError}</p>}</fieldset><div className="control-official-channel-list">{officialLinks.channels.map((channel)=><article key={channel.platform}><b>{channel.platform}</b><a href={channel.url} target="_blank" rel="noreferrer">{channel.url}</a><button type="button" onClick={()=>{setOfficialPlatform(channel.platform);setOfficialPlatformUrl(channel.url);setOfficialPlatformError("")}}>EDITAR</button><button className="danger" type="button" onClick={()=>{setOfficialLinks((current)=>({...current,channels:current.channels.filter((item)=>item.platform!==channel.platform)}));setLinksSaveState("idle")}}>REMOVER</button></article>)}</div><fieldset><legend>DESTINOS INSTITUCIONAIS</legend><label>E-MAIL OFICIAL<input type="email" value={officialLinks.email} onChange={(event)=>{setOfficialLinks((current)=>({...current,email:event.target.value}));setLinksSaveState("idle")}} required /></label><label>LINK DA COMUNIDADE<input type="text" inputMode="url" value={officialLinks.community} onChange={(event)=>{setOfficialLinks((current)=>({...current,community:event.target.value}));setOfficialPlatformError("");setLinksSaveState("idle")}} required /></label></fieldset><div className="control-editor-actions"><p>{linksSaveState === "saved" ? "LINKS PUBLICADOS EM TODO O SITE." : linksSaveState === "error" ? "ERRO AO SALVAR LINKS. REVISE OS ENDEREÇOS." : "A LISTA SERÁ USADA NO FOOTER, PARCERIAS E BOTÕES DAS PLATAFORMAS."}</p><a href="/" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit" disabled={linksSaveState === "saving"}>{linksSaveState === "saving" ? "PUBLICANDO..." : "SALVAR LINKS →"}</button></div></form></section>}
      {(admin?.role === "owner" || admin?.role === "admin") && selectedArea === "06-01" && <section className="control-team" aria-labelledby="team-title"><div className="control-editor-heading"><div><small>06.01 / ADMINISTRAÇÃO</small><h2 id="team-title">EQUIPE & ACESSOS</h2><p>Convide colaboradores e defina exatamente o que cada pessoa pode administrar.</p></div><span>{teamMembers.filter((item) => item.active).length} ACESSOS ATIVOS</span></div><div className="control-role-guide"><article><b>OWNER</b><p>Controle completo e decisões críticas.</p></article><article><b>ADMIN</b><p>Equipe, conteúdo, comunidade e sistemas.</p></article><article><b>EDITOR</b><p>Site, agenda, vídeos e área comercial.</p></article><article><b>MODERADOR</b><p>ChatBattle, ArrobaSrv e comunidade.</p></article></div><form className="control-invite-form" onSubmit={handleInvite}><label>E-MAIL DO CONVIDADO<input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required placeholder="PESSOA@EMAIL.COM" /></label><label>FUNÇÃO<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as TeamInvite["role"])}><option value="moderator">MODERADOR</option><option value="editor">EDITOR</option><option value="admin">ADMIN</option></select></label><button type="submit">CRIAR CONVITE →</button></form>{teamMessage && <div className="control-team-message">{teamMessage}</div>}<div className="control-list-toolbar control-team-toolbar"><label><span>⌕</span><input value={teamSearch} onChange={(event)=>setTeamSearch(event.target.value)} placeholder="BUSCAR MEMBRO, E-MAIL OU FUNÇÃO" /></label><select aria-label="Filtrar equipe" value={teamFilter} onChange={(event)=>setTeamFilter(event.target.value as typeof teamFilter)}><option value="all">TODA A EQUIPE</option><option value="active">ATIVOS</option><option value="suspended">SUSPENSOS</option></select><b>{visibleTeamMembers.length} RESULTADOS</b></div><section className="control-team-list"><header><b>EQUIPE ATUAL</b><span>PERMISSÕES EM TEMPO REAL</span></header>{visibleTeamMembers.length===0?<div className="control-community-empty">NENHUM MEMBRO NESTE FILTRO.</div>:visibleTeamMembers.map((member) => <article key={member.user_id}><div><strong>{member.display_name}</strong><small>{member.email}</small></div><select value={member.role} disabled={member.role === "owner"} onChange={(event) => void updateMember(member,{role:event.target.value as TeamMember["role"]})}><option value="owner">OWNER</option><option value="admin">ADMIN</option><option value="editor">EDITOR</option><option value="moderator">MODERADOR</option></select><button className={member.active ? "active" : ""} disabled={member.role === "owner"} type="button" onClick={() => void updateMember(member,{active:!member.active})}>{member.active ? "ATIVO" : "SUSPENSO"}</button></article>)}</section><section className="control-invite-list"><header><b>CONVITES</b><span>O CONVIDADO DEVE CRIAR A CONTA COM O MESMO E-MAIL</span></header>{teamInvites.map((invite) => <article key={invite.id}><span>{invite.email}<small>{new Date(invite.created_at).toLocaleDateString("pt-BR")}</small></span><b>{invite.role.toUpperCase()}</b><em>{invite.accepted_at ? "ACEITO" : invite.active ? "PENDENTE" : "ENCERRADO"}</em>{invite.active&&!invite.accepted_at&&<button type="button" onClick={()=>void closeInvite(invite)}>ENCERRAR</button>}</article>)}</section></section>}
      {!selectedArea.startsWith("07-") && !["00-01","01-01","01-02","01-03","01-04","03-00","03-01","03-02","03-03","03-04","04-01","04-02","05-01","05-02","05-03","06-01","06-02"].includes(selectedArea) && <section className="control-empty-state"><small>{selectedGroup?.number} / {selectedGroup?.title}</small><span>MODULE_{selectedArea.replace("-", "_")}</span><h1>{selectedItem?.[1]}</h1><p>Esta área já está organizada na arquitetura do Control e será conectada aos dados na próxima etapa.</p><b>ESTRUTURA PREPARADA</b></section>}
      {(admin?.role === "owner" || admin?.role === "admin") && selectedArea.startsWith("07-") && <section className="control-backend" id="area-07" aria-labelledby="backend-title">
        <div className="control-backend-heading"><div><small>07 / ACESSO AVANÇADO / SOMENTE LEITURA</small><h2 id="backend-title">{selectedArea==="07-01"?"VISÃO DO BANCO":selectedArea==="07-02"?"TABELAS & REGISTROS":"SEGURANÇA & LOGS"}</h2><p>{selectedArea==="07-01"?"Saúde geral da infraestrutura e dos serviços monitorados.":selectedArea==="07-02"?"Volumes do schema público sem acesso ao conteúdo dos registros.":"Diagnósticos operacionais e garantias de proteção do ambiente."}</p></div><span><i /> READ ONLY</span></div>
        {selectedArea==="07-01"&&<><div className="control-backend-health"><article><span>BANCO DE DADOS</span><b>CONNECTED</b><small>SUPABASE / POSTGRES</small></article><article><span>SEGURANÇA</span><b>RLS ACTIVE</b><small>POLÍTICAS POR PERFIL</small></article><article><span>AUTENTICAÇÃO</span><b>ONLINE</b><small>SESSÃO PROTEGIDA</small></article><article><span>TABELAS GERENCIADAS</span><b>{backendTables.length.toString().padStart(2,"0")}</b><small>SCHEMA PUBLIC</small></article></div><div className="control-backend-readonly"><b>PAINEL DE OBSERVABILIDADE</b><p>Esta área consulta apenas contagens e estados já autorizados. Não existem comandos SQL, edição de registros, exportação de credenciais ou exclusão de dados.</p><span>OWNER / ADMIN · SESSÃO {admin.role.toUpperCase()}</span></div></>}
        {selectedArea==="07-02"&&<section className="control-backend-tables"><div className="control-list-toolbar"><label><span>⌕</span><input value={backendSearch} onChange={(event)=>setBackendSearch(event.target.value)} placeholder="BUSCAR TABELA OU NOME TÉCNICO" /></label><b>{visibleBackendTables.length} RESULTADOS</b></div><header><b>TABELAS & REGISTROS</b><span>CONTAGEM AO VIVO / SOMENTE LEITURA</span></header>{visibleBackendTables.length===0?<div className="control-community-empty">NENHUMA TABELA ENCONTRADA.</div>:visibleBackendTables.map((item)=><div className="control-table-row" key={item.table}><span>{item.label}<small>{item.table}</small></span><b>{item.count===null?"...":item.count.toString().padStart(2,"0")}</b></div>)}</section>}
        {selectedArea==="07-03"&&<><div className="control-security-grid"><article><small>ACESSO ATUAL</small><b>{admin.role.toUpperCase()}</b><p>{admin.email}</p></article><article><small>POLÍTICAS</small><b>RLS ACTIVE</b><p>Consultas limitadas pelo perfil autenticado.</p></article><article><small>SEGREDOS</small><b>SERVER ONLY</b><p>Tokens e chaves não são enviados ao navegador.</p></article><article><small>MUTAÇÕES</small><b>DESATIVADAS</b><p>Nenhuma ação de banco está disponível nesta área.</p></article></div><section className="control-runtime-logs"><header><b>DIAGNÓSTICOS RECENTES</b><span>INTEGRAÇÕES & FILA</span></header>{platformIntegrations.filter((item)=>item.last_error).map((item)=><div key={item.platform}><b>{item.platform}</b><span>{item.last_error}</span></div>)}{botOutbox.filter((item)=>item.status==="failed").slice(0,8).map((item)=><div key={item.id}><b>ARROBASRV / {item.event_key}</b><span>{item.last_error||"Falha sem detalhe disponível."}</span></div>)}{!platformIntegrations.some((item)=>item.last_error)&&!botOutbox.some((item)=>item.status==="failed")&&<div className="control-runtime-clear"><b>NENHUM ERRO OPERACIONAL REGISTRADO.</b></div>}</section><div className="control-backend-warning"><b>ZONA PROTEGIDA</b><p>Chaves privadas, SQL arbitrário, conteúdo dos registros e credenciais nunca serão expostos no navegador.</p></div></>}
      </section>}
      {selectedArea === "04-01" && <section className="control-community"><div className="control-editor-heading"><div><small>04.01 / COMUNIDADE & LIVE</small><h2>MÉTRICAS PÚBLICAS</h2><p>Controle os quatro indicadores públicos e preserve um valor manual enquanto Twitch e Kick não estiverem conectadas.</p></div><span>{communityMetrics.filter((metric)=>metric.is_public).length} VISÍVEIS</span></div><div className="control-metric-preview" aria-label="Prévia das métricas públicas">{communityMetrics.filter((metric)=>metric.is_public).map((metric)=><article key={metric.metric_key}><small>{metric.label}</small><b>{metric.value}</b><span>{metric.helper_text||metric.source}</span></article>)}</div><form data-control-form="metrics" onSubmit={handleMetricsSave}><div className="control-metric-editor">{communityMetrics.map((metric,index)=><fieldset key={metric.metric_key}><legend>METRIC_{String(index+1).padStart(2,"0")}</legend><label>RÓTULO <small>{metric.label.length}/32</small><input maxLength={32} value={metric.label} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,label:event.target.value}:item))} /></label><label>VALOR <small>{metric.value.length}/16</small><input maxLength={16} value={metric.value} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,value:event.target.value}:item))} /></label><label>AUXILIAR <small>{metric.helper_text.length}/48</small><input maxLength={48} value={metric.helper_text} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,helper_text:event.target.value}:item))} /></label><label>ORIGEM<select value={metric.source} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,source:event.target.value}:item))}><option>MANUAL</option><option>TWITCH</option><option>KICK</option><option>TWITCH + KICK</option><option>SISTEMA</option></select></label><label className="control-check"><input type="checkbox" checked={metric.is_public} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,is_public:event.target.checked}:item))} /> EXIBIR</label></fieldset>)}</div><div className="control-editor-actions"><p>{communitySaveState==="saved"?"MÉTRICAS PUBLICADAS.":communitySaveState==="error"?"ERRO AO SALVAR.":"FALLBACK MANUAL ATIVO."}</p><a href="/#comunidade" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit">SALVAR MÉTRICAS →</button></div></form></section>}
      {selectedArea === "03-02" && <section className="control-community"><div className="control-editor-heading"><div><small>03.02 / ARROBASRV</small><h2>ARQUIVO DE QUOTES</h2><p>Admin e moderadores podem criar, corrigir, publicar ou excluir quotes. No chat, use o número exibido em cada linha.</p></div><span>{communityQuotes.filter((quote)=>quote.status==="approved").length} PUBLICADAS</span></div><form data-control-form="quotes" className="control-quote-create" onSubmit={handleQuoteCreate}><label className="wide">FRASE <small>{quoteDraft.quote_text.length}/280</small><textarea maxLength={280} value={quoteDraft.quote_text} onChange={(event)=>setQuoteDraft((item)=>({...item,quote_text:event.target.value}))} required /></label><label>USUÁRIO<input value={quoteDraft.author_name} onChange={(event)=>setQuoteDraft((item)=>({...item,author_name:event.target.value}))} required /></label><label>PLATAFORMA<select value={quoteDraft.platform} onChange={(event)=>setQuoteDraft((item)=>({...item,platform:event.target.value as CommunityQuote["platform"]}))}><option>TWITCH</option><option>KICK</option><option>MANUAL</option></select></label><label>DATA<input type="datetime-local" value={quoteDraft.quoted_at} onChange={(event)=>setQuoteDraft((item)=>({...item,quoted_at:event.target.value}))} /></label><label>PUBLICAÇÃO<select value={quoteDraft.status} onChange={(event)=>setQuoteDraft((item)=>({...item,status:event.target.value as CommunityQuote["status"]}))}><option value="approved">APROVAR AGORA</option><option value="pending">PENDENTE</option></select></label><button type="submit">ADICIONAR QUOTE →</button></form><aside className="control-quote-chat-help"><b>EDIÇÃO PELO CHAT / SOMENTE MODERAÇÃO</b><span>!editquote NÚMERO NOVA FRASE</span><span>!delquote NÚMERO</span></aside><div className="control-list-toolbar"><label><span>⌕</span><input value={quoteSearch} onChange={(event)=>setQuoteSearch(event.target.value)} placeholder="BUSCAR QUOTE, AUTOR OU NÚMERO" /></label><select aria-label="Filtrar quotes" value={quoteFilter} onChange={(event)=>setQuoteFilter(event.target.value as typeof quoteFilter)}><option value="all">TODOS OS STATUS</option><option value="approved">PUBLICADAS</option><option value="pending">PENDENTES</option><option value="rejected">REJEITADAS</option><option value="archived">ARQUIVADAS</option></select><b>{visibleQuotes.length} RESULTADOS</b></div><div className="control-quote-table-head"><span>ID</span><span>QUOTE</span><span>AUTOR</span><span>STATUS</span><span /></div><div className="control-quote-list">{visibleQuotes.length===0?<div className="control-community-empty">NENHUMA QUOTE ENCONTRADA.</div>:visibleQuotes.map(({quote,index})=>{const isOpen=openQuoteId===quote.id;return <article className={`control-command-accordion${isOpen?" open":""}`} key={quote.id}><button className="control-quote-summary" type="button" aria-expanded={isOpen} aria-controls={`quote-${quote.id}`} onClick={()=>setOpenQuoteId(isOpen?null:quote.id??null)}><strong>#{quote.quote_number??"--"}</strong><blockquote>“{quote.quote_text}”</blockquote><b>— {quote.author_name}</b><em>{quote.status.toUpperCase()}</em><i>{isOpen?"−":"⌄"}</i></button>{isOpen&&<fieldset id={`quote-${quote.id}`}><label className="wide">FRASE<textarea maxLength={280} value={quote.quote_text} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,quote_text:event.target.value}:item))} /></label><label>USUÁRIO<input value={quote.author_name} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,author_name:event.target.value}:item))} /></label><label>PLATAFORMA<select value={quote.platform} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,platform:event.target.value as CommunityQuote["platform"]}:item))}><option>TWITCH</option><option>KICK</option><option>MANUAL</option></select></label><label>DATA<input type="datetime-local" value={new Date(quote.quoted_at).toISOString().slice(0,16)} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,quoted_at:event.target.value}:item))} /></label><label>PUBLICAÇÃO<select value={quote.status} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,status:event.target.value as CommunityQuote["status"]}:item))}><option value="pending">PENDENTE</option><option value="approved">PUBLICADA</option><option value="rejected">REJEITADA</option><option value="archived">ARQUIVADA</option></select></label><div className="control-quote-actions"><button className="danger" type="button" onClick={()=>void deleteQuote(quote)}>EXCLUIR QUOTE</button><button type="button" onClick={()=>void saveQuote(quote)}>SALVAR ALTERAÇÕES →</button></div></fieldset>}</article>})}</div><div className="control-editor-actions"><p>{communitySaveState==="saved"?"ARQUIVO DE QUOTES ATUALIZADO.":communitySaveState==="error"?"ERRO AO SALVAR A QUOTE.":"ALTERAÇÕES SÃO PUBLICADAS APÓS SALVAR."}</p></div></section>}
      {selectedArea === "04-02" && <section className="control-community"><div className="control-editor-heading"><div><small>04.02 / COMUNIDADE & LIVE</small><h2>ANIVERSÁRIOS</h2><p>Jogadores cadastrados entram automaticamente. O aviso prepara a celebração no site e a mensagem do ArrobaSrv.</p></div><span>{birthdayPlayers.filter((player)=>player.birthday_party_enabled).length} AVISOS LIGADOS</span></div><div className="control-list-toolbar"><label><span>⌕</span><input value={birthdaySearch} onChange={(event)=>setBirthdaySearch(event.target.value)} placeholder="BUSCAR JOGADOR OU PLATAFORMA" /></label><select aria-label="Filtrar aniversários" value={birthdayFilter} onChange={(event)=>setBirthdayFilter(event.target.value as typeof birthdayFilter)}><option value="all">TODOS OS AVISOS</option><option value="enabled">LIGADOS</option><option value="disabled">DESLIGADOS</option></select><b>{visibleBirthdayPlayers.length} RESULTADOS</b></div><div className="control-birthday-list">{visibleBirthdayPlayers.length===0?<div className="control-community-empty">NENHUM JOGADOR COM ANIVERSÁRIO CADASTRADO.</div>:visibleBirthdayPlayers.map((player)=><article key={player.id}><div className="control-birthday-player"><b>{player.display_name||player.username}</b><small>@{player.username} · {player.platform} · {player.birthday?new Date(`${player.birthday}T12:00:00`).toLocaleDateString("pt-BR"):"--"}</small><em className={savingBirthdayId===player.id?"saving":savedBirthdayId===player.id?"saved":""}>{savingBirthdayId===player.id?"SALVANDO...":savedBirthdayId===player.id?"SALVO ✓":player.birthday_public?"DATA PÚBLICA":"DATA PRIVADA"}</em></div><label className="control-birthday-message">MENSAGEM DO BOT <small>{(player.birthday_message??"").length}/160</small><input maxLength={160} value={player.birthday_message??""} onBlur={(event)=>void updateBirthday(player,{birthday_message:event.target.value||null})} onChange={(event)=>setBirthdayPlayers((items)=>items.map((item)=>item.id===player.id?{...item,birthday_message:event.target.value}:item))} /></label><button className={`control-birthday-toggle${player.birthday_party_enabled?" active":""}`} type="button" aria-pressed={player.birthday_party_enabled} aria-label={`${player.birthday_party_enabled?"Desligar":"Ligar"} aviso de aniversário de ${player.display_name||player.username}`} onClick={()=>void updateBirthday(player,{birthday_party_enabled:!player.birthday_party_enabled})}><span><i />{player.birthday_party_enabled?"AVISO LIGADO":"AVISO DESLIGADO"}</span><strong>{player.birthday_party_enabled?"DESLIGAR AVISO":"LIGAR AVISO"}</strong></button></article>)}</div></section>}
      {selectedArea === "05-01" && <section className="control-commercial"><div className="control-editor-heading"><div><small>05.01 / COMERCIAL</small><h2>MEDIA KIT</h2><p>Edite a apresentação comercial mantendo a composição premium aprovada no site.</p></div><span>{commercialContent.formats.length} FORMATOS</span></div><div className="control-media-preview"><small>{commercialContent.coverEyebrow}</small><b>{commercialContent.coverTitle}</b><p>{commercialContent.coverDescription}</p></div><form data-control-form={selectedArea==="05-02"?"partners":"media-kit"} onSubmit={handleCommercialSave}><fieldset><legend>CAPA DO MEDIA KIT</legend><label>IDENTIFICAÇÃO <small>{commercialContent.coverEyebrow.length}/60</small><input maxLength={60} value={commercialContent.coverEyebrow} onChange={(event)=>setCommercialContent((item)=>({...item,coverEyebrow:event.target.value}))} /></label><label className="wide">TÍTULO <small>{commercialContent.coverTitle.length}/100</small><input maxLength={100} value={commercialContent.coverTitle} onChange={(event)=>setCommercialContent((item)=>({...item,coverTitle:event.target.value}))} /></label><label className="wide">DESCRIÇÃO <small>{commercialContent.coverDescription.length}/240</small><textarea maxLength={240} value={commercialContent.coverDescription} onChange={(event)=>setCommercialContent((item)=>({...item,coverDescription:event.target.value}))} /></label></fieldset><fieldset><legend>APRESENTAÇÃO & DIFERENCIAL</legend><label>TÍTULO SOBRE<input value={commercialContent.aboutTitle} onChange={(event)=>setCommercialContent((item)=>({...item,aboutTitle:event.target.value}))} /></label><label className="wide">SOBRE<textarea value={commercialContent.aboutText} onChange={(event)=>setCommercialContent((item)=>({...item,aboutText:event.target.value}))} /></label><label className="wide">TÍTULO DIFERENCIAL<input value={commercialContent.differenceTitle} onChange={(event)=>setCommercialContent((item)=>({...item,differenceTitle:event.target.value}))} /></label><label className="wide">TEXTO DIFERENCIAL<textarea value={commercialContent.differenceText} onChange={(event)=>setCommercialContent((item)=>({...item,differenceText:event.target.value}))} /></label></fieldset><div className="control-format-editor">{commercialContent.formats.map((format,index)=><fieldset key={index}><legend>FORMATO_{String(index+1).padStart(2,"0")}</legend><label>TÍTULO<input value={format.title} onChange={(event)=>setCommercialContent((item)=>({...item,formats:item.formats.map((current,i)=>i===index?{...current,title:event.target.value}:current)}))} /></label><label>DESCRIÇÃO<textarea value={format.description} onChange={(event)=>setCommercialContent((item)=>({...item,formats:item.formats.map((current,i)=>i===index?{...current,description:event.target.value}:current)}))} /></label></fieldset>)}</div><div className="control-editor-actions"><p>{commercialSaveState==="saved"?"CONTEÚDO DO MEDIA KIT PUBLICADO.":commercialSaveState==="error"?"ERRO AO PUBLICAR.":"ESTAS ALTERAÇÕES APARECEM NO MEDIA KIT."}</p><a href="/#parcerias" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit">SALVAR MEDIA KIT →</button></div></form></section>}
      {selectedArea === "05-03" && <section className="control-inbox"><div className="control-editor-heading"><div><small>05.03 / COMERCIAL</small><h2>CAIXA DE MENSAGENS</h2><p>Organize contatos recebidos pelo site e mantenha o histórico de atendimento.</p></div><span>{contactMessages.filter((item)=>item.status==="new").length} NOVAS</span></div><div className="control-list-toolbar"><label><span>⌕</span><input value={contactSearch} onChange={(event)=>setContactSearch(event.target.value)} placeholder="BUSCAR REMETENTE, ASSUNTO OU MENSAGEM" /></label><select aria-label="Filtrar mensagens" value={contactFilter} onChange={(event)=>setContactFilter(event.target.value as typeof contactFilter)}><option value="all">TODOS OS STATUS</option><option value="new">NOVAS</option><option value="read">LIDAS</option><option value="replied">RESPONDIDAS</option><option value="archived">ARQUIVADAS</option><option value="spam">SPAM</option></select><b>{visibleContactMessages.length} RESULTADOS</b></div><div className="control-inbox-list">{visibleContactMessages.length===0?<div className="control-community-empty">NENHUMA MENSAGEM RECEBIDA.</div>:visibleContactMessages.map((messageItem)=><article className={messageItem.status==="new"?"new":""} key={messageItem.id}><header><div><small>{messageItem.contact_type||"CONTATO"} · {new Date(messageItem.created_at).toLocaleString("pt-BR")}</small><h3>{messageItem.subject}</h3><b>{messageItem.sender_name} · {messageItem.sender_email}</b>{messageItem.company&&<span>{messageItem.company}</span>}<em className={savingContactId===messageItem.id?"saving":savedContactId===messageItem.id?"saved":""}>{savingContactId===messageItem.id?"SALVANDO...":savedContactId===messageItem.id?"SALVO ✓":messageItem.status.toUpperCase()}</em></div><select value={messageItem.status} onChange={(event)=>void updateContactMessage(messageItem,{status:event.target.value as ContactMessage["status"]})}><option value="new">NOVA</option><option value="read">LIDA</option><option value="replied">RESPONDIDA</option><option value="archived">ARQUIVADA</option><option value="spam">SPAM</option></select></header><p>{messageItem.message}</p><label>NOTAS INTERNAS<textarea defaultValue={messageItem.admin_notes??""} onBlur={(event)=>void updateContactMessage(messageItem,{admin_notes:event.target.value})} /></label><a href={`mailto:${messageItem.sender_email}?subject=${encodeURIComponent(`Re: ${messageItem.subject}`)}`}>RESPONDER POR E-MAIL ↗</a></article>)}</div></section>}
      {selectedArea === "03-01" && <section className="control-bot"><div className="control-editor-heading"><div><small>03.01 / ARROBASRV</small><h2>CANAIS & COMANDOS</h2><p>Configure o comportamento compartilhado do bot. Tokens e segredos permanecem fora do navegador.</p></div><span>{botCommands.filter((item)=>item.enabled).length} COMANDOS ATIVOS</span></div><form data-control-form={selectedArea==="03-03"?"automations":"bot-core"} onSubmit={saveBotCore}><div className="control-bot-channels">{botChannels.map((channel,index)=><article key={channel.platform}><header><b>{channel.platform}</b><span className={channel.connection_status}>{channel.connection_status.toUpperCase()}</span></header><label>CANAL<input value={channel.channel_name} onChange={(event)=>setBotChannels((items)=>items.map((item,i)=>i===index?{...item,channel_name:event.target.value}:item))} /></label><label className="control-check"><input type="checkbox" checked={channel.enabled} onChange={(event)=>setBotChannels((items)=>items.map((item,i)=>i===index?{...item,enabled:event.target.checked,connection_status:event.target.checked?"configured":"disconnected"}:item))} /> HABILITAR ADAPTADOR</label><small>CREDENCIAL SERÁ CONFIGURADA SOMENTE NO SERVIDOR.</small></article>)}</div><div className="control-command-toolbar"><label><span>⌕</span><input value={botCommandSearch} onChange={(event)=>{setBotCommandSearch(event.target.value);clearDirtyForms("bot-core")}} placeholder="PESQUISAR COMANDO" /></label><select aria-label="Filtrar comandos" value={botCommandFilter} onChange={(event)=>{setBotCommandFilter(event.target.value as typeof botCommandFilter);clearDirtyForms("bot-core")}}><option value="all">TODOS</option><option value="active">ATIVOS</option><option value="inactive">INATIVOS</option></select><b>{visibleBotCommands.length} RESULTADOS</b><button type="button" onClick={()=>setShowBotVariables((value)=>!value)}>VARIÁVEIS ↗</button><button className="primary" type="button" onClick={()=>{const id=crypto.randomUUID();setBotCommands((items)=>[...items,{id,command:`!comando_${Date.now().toString().slice(-6)}`,description:"Novo comando personalizado.",response_template:"@{{user}}, configure esta resposta.",permission:"everyone",cooldown_seconds:10,enabled:false,sort_order:items.length+1}]);setOpenBotCommandId(id)}}>+ NOVO COMANDO</button></div>{showBotVariables&&<aside className="control-command-variables"><b>VARIÁVEIS DISPONÍVEIS</b><span>{"{{user}}"}</span><span>{"{{display_name}}"}</span><span>{"{{arguments}}"}</span><span>{"{{profile_url}}"}</span><span>{"{{rank}}"}</span><span>{"{{level}}"}</span><span>{"{{category}}"}</span><span>{"{{birthday_users}}"}</span></aside>}<div className="control-command-table-head"><span>STATUS</span><span>COMANDO</span><span>RESPOSTA</span><span>ESPERA</span><span>ACESSO</span><span /></div><div className="control-bot-commands">{visibleBotCommands.map(({command,index})=>{const isOpen=openBotCommandId===command.id;return <article className={`control-command-accordion${isOpen?" open":""}`} key={command.id}><div className="control-command-row"><label className="control-command-switch" title={command.enabled?"Desativar comando":"Ativar comando"}><input type="checkbox" checked={command.enabled} onChange={(event)=>toggleBotCommand(command,index,event.target.checked)} /><span /></label><button className="control-command-summary" type="button" aria-expanded={isOpen} aria-controls={`command-${command.id}`} onClick={()=>setOpenBotCommandId(isOpen?null:command.id)}><b>{command.command}</b><em>{command.response_template}</em><small>{command.cooldown_seconds}S</small><strong>{command.permission.toUpperCase()}</strong><i>{isOpen?"−":"⌄"}</i></button></div>{isOpen&&<fieldset id={`command-${command.id}`}><label>COMANDO<input value={command.command} pattern="^![a-z0-9_]+$" onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,command:event.target.value.toLowerCase()}:item))} /></label><label>DESCRIÇÃO<input value={command.description} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,description:event.target.value}:item))} /></label><label className="wide">RESPOSTA / TEMPLATE<textarea value={command.response_template} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,response_template:event.target.value}:item))} /></label><label>PERMISSÃO<select value={command.permission} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,permission:event.target.value as BotCommand["permission"]}:item))}><option value="everyone">TODOS</option><option value="follower">FOLLOWERS</option><option value="subscriber">SUBS</option><option value="moderator">MODERADORES</option><option value="broadcaster">THENEES</option></select></label><label>COOLDOWN / SEG<input type="number" min="0" max="3600" value={command.cooldown_seconds} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,cooldown_seconds:Number(event.target.value)}:item))} /></label><div className="control-command-edit-actions"><span>EXCLUIR REMOVE O COMANDO APÓS SALVAR.</span><button className="danger" type="button" onClick={()=>{if(window.confirm(`Remover o comando ${command.command}?`)){setBotCommands((items)=>items.filter((_,i)=>i!==index));setOpenBotCommandId(null)}}}>REMOVER COMANDO</button></div></fieldset>}</article>})}</div>{botCommandError&&<div className="control-command-error" role="alert">{botCommandError}</div>}<div className="control-editor-actions"><p>{botSaveState==="saved"?"CONFIGURAÇÃO DO ARROBASRV SALVA.":botSaveState==="error"?"ERRO AO SALVAR O ARROBASRV.":"A CONEXÃO REAL SERÁ FEITA NOS ADAPTADORES TWITCH E KICK."}</p><button type="submit">SALVAR ARROBASRV →</button></div></form></section>}
      {selectedArea === "03-03" && <section className="control-bot"><div className="control-editor-heading"><div><small>03.03 / ARROBASRV</small><h2>AUTOMAÇÕES & FILA</h2><p>Ative os eventos pela lista e abra somente a automação que deseja editar.</p></div><span>{botOutbox.filter((item)=>item.status==="pending").length} NA FILA</span></div>{renderSpecialViewerMessages()}<form data-control-form={selectedArea==="03-03"?"automations":"bot-core"} onSubmit={saveBotCore}><div className="control-list-toolbar"><div className="control-filter-label">AUTOMAÇÕES CONFIGURADAS</div><select aria-label="Filtrar automações" value={automationFilter} onChange={(event)=>{setAutomationFilter(event.target.value as typeof automationFilter);clearDirtyForms("automations")}}><option value="all">TODAS</option><option value="active">ATIVAS</option><option value="inactive">INATIVAS</option></select><b>{visibleAutomations.length} RESULTADOS</b></div><div className="control-automation-table-head"><span>STATUS</span><span>EVENTO</span><span>MENSAGEM</span><span>DESTINO</span><span>LINK</span><span /></div><div className="control-automation-list">{visibleAutomations.length===0?<div className="control-community-empty">NENHUMA AUTOMAÇÃO NESTE FILTRO.</div>:visibleAutomations.map(({automation,index})=>{const isOpen=openBotAutomationKey===automation.event_key;return <article className={`control-automation-accordion${isOpen?" open":""}`} key={automation.event_key}><div className="control-automation-row"><label className="control-command-switch" title={automation.enabled?"Desativar automação":"Ativar automação"}><input type="checkbox" checked={automation.enabled} onChange={(event)=>void updateAutomationOption(automation,"enabled",event.target.checked)} /><span /></label><button className="control-automation-summary" type="button" aria-expanded={isOpen} aria-controls={`automation-${automation.event_key}`} onClick={()=>setOpenBotAutomationKey(isOpen?null:automation.event_key)}><b>{automation.label}</b><em>{automation.message_template}</em><strong>{automation.target_platform}</strong><small>{automation.include_site_link?"SIM":"NÃO"}</small><i>{isOpen?"−":"⌄"}</i></button></div>{isOpen&&<fieldset id={`automation-${automation.event_key}`}><label>RÓTULO<input value={automation.label} onChange={(event)=>setBotAutomations((items)=>items.map((item,i)=>i===index?{...item,label:event.target.value}:item))} /></label><label>DESTINO<select value={automation.target_platform} onChange={(event)=>setBotAutomations((items)=>items.map((item,i)=>i===index?{...item,target_platform:event.target.value as BotAutomation["target_platform"]}:item))}><option>BOTH</option><option>TWITCH</option><option>KICK</option></select></label><label className="wide">MENSAGEM / TEMPLATE<textarea value={automation.message_template} onChange={(event)=>setBotAutomations((items)=>items.map((item,i)=>i===index?{...item,message_template:event.target.value}:item))} /></label><label className="control-check"><input type="checkbox" checked={automation.include_site_link} onChange={(event)=>void updateAutomationOption(automation,"include_site_link",event.target.checked)} /> INCLUIR LINK DO SITE</label></fieldset>}</article>})}</div><div className="control-editor-actions"><p>{botSaveState==="saved"?"AUTOMAÇÕES SALVAS.":botSaveState==="error"?"ERRO AO PROCESSAR.":"O STATUS É SALVO IMEDIATAMENTE. ABRA UMA LINHA PARA EDITAR A MENSAGEM."}</p><button type="button" onClick={()=>void queueBirthdays()}>ENFILEIRAR ANIVERSÁRIOS DE HOJE</button><button type="submit">SALVAR AUTOMAÇÕES →</button></div></form><section className="control-bot-outbox"><button className={`control-outbox-group-toggle${showOutboxList?" open":""}`} type="button" aria-expanded={showOutboxList} onClick={()=>setShowOutboxList((value)=>!value)}><span><small>HISTÓRICO OPERACIONAL</small><b>FILA DE ENTREGA</b></span><strong>{botOutbox.filter((item)=>item.status==="pending").length} PENDENTES / {botOutbox.length} EVENTOS</strong><i /></button>{showOutboxList&&<><div className="control-outbox-filters" aria-label="Filtrar fila"><button className={outboxFilter==="all"?"active":""} type="button" onClick={()=>setOutboxFilter("all")}>TODOS {botOutbox.length}</button><button className={outboxFilter==="pending"?"active":""} type="button" onClick={()=>setOutboxFilter("pending")}>PENDENTES {botOutbox.filter((item)=>item.status==="pending").length}</button><button className={outboxFilter==="failed"?"active":""} type="button" onClick={()=>setOutboxFilter("failed")}>FALHAS {botOutbox.filter((item)=>item.status==="failed").length}</button><button className={outboxFilter==="sent"?"active":""} type="button" onClick={()=>setOutboxFilter("sent")}>ENVIADOS {botOutbox.filter((item)=>item.status==="sent").length}</button></div>{visibleOutbox.length===0?<div className="control-community-empty">NENHUM EVENTO NESTE FILTRO.</div>:visibleOutbox.map((item)=><article key={item.id}><span><b>{item.event_key}</b><small>{item.target_platform} · {new Date(item.created_at).toLocaleString("pt-BR")}</small></span><strong className={item.status}>{item.status.toUpperCase()}</strong><em>{item.attempts} TENTATIVAS</em>{item.status==="failed"&&<button type="button" onClick={()=>void retryBotItem(item)}>REPROCESSAR</button>}</article>)}</>}</section></section>}
      {selectedArea === "06-02" && <section className="control-integrations"><div className="control-editor-heading"><div><small>06.02 / ADMINISTRAÇÃO</small><h2>INTEGRAÇÕES</h2><p>Conecte as plataformas por OAuth. Tokens permanecem no ambiente privado das funções e nunca são enviados ao navegador.</p></div><span>OAUTH / EVENTOS</span></div><div className="control-integration-summary"><article><small>PLATAFORMAS</small><b>{platformIntegrations.length}</b></article><article><small>CONECTADAS</small><b>{platformIntegrations.filter((item)=>item.status==="connected").length}</b></article><article><small>COM ERRO</small><b>{platformIntegrations.filter((item)=>item.status==="error").length}</b></article><article><small>EVENTOS ATIVOS</small><b>{platformIntegrations.filter((item)=>item.eventsub_status==="active").length}</b></article></div>{integrationMessage&&<div className="control-team-message">{integrationMessage}</div>}<div className="control-integration-grid">{platformIntegrations.map((integration)=><article key={integration.platform}><header><div><small>PLATAFORMA</small><h3>{integration.platform}</h3></div><span className={integration.status}>{integration.status.toUpperCase()}</span></header><dl><div><dt>CANAL</dt><dd>{integration.channel_login||"thenees"}</dd></div><div><dt>CONTA</dt><dd>{integration.bot_display_name||integration.display_name||"AGUARDANDO AUTORIZAÇÃO"}</dd></div><div><dt>EVENTOS</dt><dd>{integration.eventsub_status.toUpperCase()}</dd></div><div><dt>ÚLTIMA SINCRONIA</dt><dd>{integration.last_synced_at?new Date(integration.last_synced_at).toLocaleString("pt-BR"):"--"}</dd></div></dl>{integration.scopes.length>0&&<div className="control-integration-scopes">{integration.scopes.map((scope)=><span key={scope}>{scope}</span>)}</div>}{integration.last_error&&<p>{integration.last_error}</p>}<footer>{integration.platform==="TWITCH"&&integration.status!=="connected"&&<button type="button" onClick={()=>void connectTwitch()}>CONECTAR TWITCH →</button>}{integration.platform==="TWITCH"&&integration.status==="connected"&&<><button type="button" onClick={()=>void subscribeTwitch()}>ATIVAR EVENTSUB</button><button type="button" onClick={()=>void testTwitchWorker()}>TESTAR FILA</button><button type="button" onClick={()=>void connectTwitch()}>REAUTORIZAR TWITCH</button></>}{integration.platform==="KICK"&&integration.status!=="connected"&&<button type="button" onClick={()=>void connectKick()}>CONECTAR KICK →</button>}{integration.platform==="KICK"&&integration.status==="connected"&&<><button type="button" onClick={()=>void subscribeKick()}>ATIVAR EVENTOS KICK</button><button type="button" onClick={()=>void testKickWorker()}>TESTAR FILA KICK</button></>}{integration.status==="connected"&&<button className="danger" type="button" onClick={()=>void disconnectIntegration(integration.platform)}>DESCONECTAR</button>}</footer></article>)}</div><aside className="control-integration-note"><b>SEGREDOS NECESSÁRIOS NO SUPABASE</b><p>TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_REDIRECT_URI, KICK_CLIENT_ID, KICK_CLIENT_SECRET, KICK_REDIRECT_URI e os segredos dos webhooks/workers.</p><span>NENHUM DESSES VALORES SERÁ EXIBIDO NESTA TELA.</span></aside></section>}
      {selectedArea === "03-04" && <section className="control-shortener"><div className="control-editor-heading"><div><small>03.04 / ARROBASRV</small><h2>ENCURTADOR DE LINKS</h2><p>Crie endereços curtos e fáceis de usar no chat, comandos e campanhas da comunidade.</p></div><span>{shortLinks.filter((item)=>item.active).length} LINKS ATIVOS</span></div><form data-control-form="short-links" className="control-shortener-form" onSubmit={createShortLink} noValidate><label>NOME DO LINK<input value={shortLinkDraft.label} onChange={(event)=>setShortLinkDraft((item)=>({...item,label:event.target.value}))} placeholder="SERVIDOR DO DISCORD" /></label><label>APELIDO / SLUG<div className="control-slug-input"><span>/go/</span><input value={shortLinkDraft.slug} onChange={(event)=>setShortLinkDraft((item)=>({...item,slug:event.target.value}))} placeholder="discord" /></div></label><label className="wide">LINK DE DESTINO<input type="text" inputMode="url" value={shortLinkDraft.destinationUrl} onChange={(event)=>setShortLinkDraft((item)=>({...item,destinationUrl:event.target.value}))} placeholder="https://..." /></label><button type="submit" disabled={shortLinkState==="saving"}>{shortLinkState==="saving"?"CRIANDO...":"CRIAR LINK CURTO →"}</button></form><div className={`control-shortener-feedback ${shortLinkState}`}>{shortLinkState==="saved"?"LINKS SINCRONIZADOS.":shortLinkState==="error"?"NÃO FOI POSSÍVEL SALVAR. CONFIRA SE O APELIDO É ÚNICO E O DESTINO É VÁLIDO.":"OS LINKS FICAM DISPONÍVEIS IMEDIATAMENTE PARA O ARROBASRV."}</div><div className="control-list-toolbar control-shortener-toolbar"><label><span>⌕</span><input value={shortLinkSearch} onChange={(event)=>setShortLinkSearch(event.target.value)} placeholder="BUSCAR POR NOME, APELIDO OU DESTINO" /></label><b>{visibleShortLinks.length} RESULTADOS</b></div><div className="control-shortener-list">{visibleShortLinks.length===0?<div className="control-community-empty">NENHUM LINK CURTO CRIADO.</div>:visibleShortLinks.map((item)=><article className={item.active?"active":""} key={item.id}><div><small>{item.label}</small><b>WWW.THENEES.COM.BR/GO/{item.slug.toUpperCase()}</b><a href={item.destinationUrl} target="_blank" rel="noreferrer">{item.destinationUrl}</a></div><span>{item.active?"ATIVO":"DESLIGADO"}</span><button type="button" onClick={()=>void navigator.clipboard.writeText(`https://www.thenees.com.br/go/${item.slug}`).then(()=>{setCopiedShortLinkId(item.id);window.setTimeout(()=>setCopiedShortLinkId(null),1800)})}>{copiedShortLinkId===item.id?"COPIADO ✓":"COPIAR"}</button><button type="button" onClick={()=>void persistShortLinks(shortLinks.map((current)=>current.id===item.id?{...current,active:!current.active}:current))}>{item.active?"DESATIVAR":"ATIVAR"}</button><button className="danger" type="button" onClick={()=>{if(window.confirm(`Excluir o link curto /go/${item.slug}?`))void persistShortLinks(shortLinks.filter((current)=>current.id!==item.id))}}>EXCLUIR</button></article>)}</div></section>}
      {selectedArea === "05-02" && <section className="control-partner-brands"><div className="control-editor-heading"><div><small>05.02 / PARCERIAS</small><h2>MARCAS & APOIADORES</h2><p>Defina os espaços agora. Quando os arquivos oficiais chegarem, cada nome poderá ser substituído pelo respectivo logo.</p></div><span>{commercialContent.partners.filter((partner)=>partner.active).length} VISÍVEIS</span></div><div className="control-list-toolbar"><label><span>⌕</span><input value={partnerSearch} onChange={(event)=>setPartnerSearch(event.target.value)} placeholder="BUSCAR MARCA" /></label><select aria-label="Filtrar marcas" value={partnerFilter} onChange={(event)=>setPartnerFilter(event.target.value as typeof partnerFilter)}><option value="all">TODAS</option><option value="visible">VISÍVEIS</option><option value="hidden">OCULTAS</option></select><b>{visiblePartners.length} RESULTADOS</b></div><form data-control-form={selectedArea==="05-02"?"partners":"media-kit"} onSubmit={handleCommercialSave}><div className="control-partner-brand-list">{visiblePartners.length===0?<div className="control-community-empty">NENHUMA MARCA NESTE FILTRO.</div>:visiblePartners.map(({partner,index})=><article key={`${partner.name}-${index}`}><span>{String(index+1).padStart(2,"0")}</span><label>NOME DA MARCA<input value={partner.name} onChange={(event)=>setCommercialContent((item)=>({...item,partners:item.partners.map((current,i)=>i===index?{...current,name:event.target.value}:current)}))} /></label><label>ARQUIVO DO LOGO <small>OPCIONAL / PARA A PRÓXIMA FASE</small><input type="url" value={partner.logo_url} onChange={(event)=>setCommercialContent((item)=>({...item,partners:item.partners.map((current,i)=>i===index?{...current,logo_url:event.target.value}:current)}))} placeholder="https://..." /></label><button className={partner.active?"active":""} type="button" onClick={()=>setCommercialContent((item)=>({...item,partners:item.partners.map((current,i)=>i===index?{...current,active:!current.active}:current)}))}>{partner.active?"VISÍVEL":"OCULTA"}</button><button className="danger" type="button" onClick={()=>{if(window.confirm(`Remover a marca ${partner.name}?`))setCommercialContent((item)=>({...item,partners:item.partners.filter((_,i)=>i!==index)}))}}>REMOVER</button></article>)}</div><button className="control-add-partner" type="button" onClick={()=>setCommercialContent((item)=>({...item,partners:[...item.partners,{name:`PARCEIRO ${String(item.partners.length+1).padStart(2,"0")}`,logo_url:"",active:true}]}))}>+ ADICIONAR ESPAÇO</button><div className="control-editor-actions"><p>{commercialSaveState==="saved"?"MARCAS PUBLICADAS NA LANDING.":commercialSaveState==="error"?"ERRO AO PUBLICAR MARCAS.":"OS NOMES APARECEM ABAIXO DOS FORMATOS DE PARCERIA."}</p><a href="/#parcerias" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit">SALVAR MARCAS →</button></div></form></section>}
      {selectedArea === "03-00" && <section className="control-bot-overview">
        <div className="control-editor-heading"><div><small>03.00 / ARROBASRV</small><h2>BOT OVERVIEW</h2><p>Seu companheiro de canal: responde comandos, recebe a comunidade e mantém as rotinas do chat organizadas.</p></div><span>CENTRAL DO BOT</span></div>
        <section className={`control-bot-health ${twitchIntegration?.status==="connected"?"online":"attention"}`}><div><i /><span><b>{twitchIntegration?.status==="connected"?"ARROBASRV ATIVO NA TWITCH":"TWITCH PRECISA DE ATENÇÃO"}</b><small>{twitchIntegration?.status==="connected"?"Comandos e eventos estão conectados ao canal.":twitchIntegration?.last_error||"Revise a conexão do bot."}</small></span></div><button type="button" onClick={()=>requestAreaChange("03-08")}>CONFIGURAR BOT →</button></section>
        <div className="control-bot-overview-metrics"><article><small>COMANDOS ATIVOS</small><b>{botCommands.filter((item)=>item.enabled).length}</b><span>{botCommands.length} CADASTRADOS</span></article><article><small>AUTOMAÇÕES</small><b>{botAutomations.filter((item)=>item.enabled).length}</b><span>{botAutomations.length} CONFIGURADAS</span></article><article><small>MENSAGENS ESPECIAIS</small><b>{specialViewerMessages.filter((item)=>item.enabled).length}</b><span>VIEWERS PERSONALIZADOS</span></article><article className={botOutbox.some((item)=>item.status==="failed")?"attention":""}><small>FILA DO BOT</small><b>{botOutbox.filter((item)=>item.status==="pending").length}</b><span>{botOutbox.filter((item)=>item.status==="failed").length} FALHAS</span></article></div>
        <div className="control-bot-module-grid">{[["03-01","⌁","COMANDOS DO CHAT","Crie, edite e organize todas as respostas acionadas por !comandos."],["03-06","+","ADICIONAR COMANDO","Monte comandos simples, dinâmicos ou com contadores."],["03-03","✦","BOAS-VINDAS & AVISOS","Automatize mensagens e saudações especiais para viewers."],["03-07","#","CONTADORES","Acompanhe contagens individuais por usuário e comando."],["03-02","”","QUOTES & MEMÓRIAS","Guarde os melhores momentos e frases da comunidade."],["03-04","↗","LINKS DO CHAT","Crie links curtos para campanhas e respostas do bot."],["03-05","?","MANUAL DA MODERAÇÃO","Consulte comandos administrativos, permissões e exemplos."],["03-08","⚙","CANAIS & STATUS","Gerencie Twitch, Kick e o estado dos adaptadores."]].map(([area,icon,title,description])=><button type="button" key={area} onClick={()=>requestAreaChange(area)}><i>{icon}</i><b>{title}</b><p>{description}</p><span>ABRIR MÓDULO →</span></button>)}</div>
      </section>}
      {selectedArea === "03-05" && <section className="control-bot-command-center">
        <div className="control-editor-heading"><div><small>03.05 / ARROBASRV / MODERAÇÃO</small><h2>MANUAL DA MODERAÇÃO</h2><p>Permissões e instruções para administrar o bot pelo chat. Os modelos disponíveis ficam somente em “Adicionar comando”.</p></div><span>ACESSO DA EQUIPE</span></div>
        <section className="control-command-manual"><header><b>O QUE CADA PERFIL PODE FAZER</b><span>PERMISSÕES DO CHAT</span></header><div><article><b>COMUNIDADE</b><p>Executa comandos públicos, consulta quotes e envia novas memórias para aprovação.</p><span>EVERYONE · FOLLOWER · SUBSCRIBER</span></article><article><b>MODERAÇÃO</b><p>Cria, edita, liga e desliga comandos. Também administra mensagens e quotes.</p><span>MODERATOR</span></article><article><b>THENEES</b><p>Acessa comandos sensíveis e mantém controle completo pelo painel.</p><span>BROADCASTER</span></article></div></section>
        <section className="control-moderator-command-center"><header><div><b>CENTRAL DE COMANDOS</b><p>Encontre a sintaxe correta, confira a permissão e copie antes de usar no chat.</p></div><span>{moderatorCommandGuides.length} AÇÕES DOCUMENTADAS</span></header><div className="control-moderator-command-toolbar"><label><span>⌕</span><input value={moderatorCommandSearch} onChange={(event)=>setModeratorCommandSearch(event.target.value)} placeholder="BUSCAR COMANDO OU FUNÇÃO" /></label><select value={moderatorCommandCategory} onChange={(event)=>setModeratorCommandCategory(event.target.value as typeof moderatorCommandCategory)}><option value="all">TODAS AS CATEGORIAS</option><option value="commands">COMANDOS</option><option value="messages">MENSAGENS</option><option value="viewers">VIEWERS</option><option value="quotes">QUOTES</option><option value="counters">CONTADORES</option></select><b>{visibleModeratorCommands.length} RESULTADOS</b></div><div className="control-moderator-command-list">{visibleModeratorCommands.length===0?<div className="control-community-empty">NENHUM COMANDO ENCONTRADO.</div>:visibleModeratorCommands.map((item)=><article key={item.id}><div><small>{item.category.toUpperCase()}</small><code>{item.syntax}</code><p>{item.description}</p></div><span>{item.permission==="broadcaster"?"THENEES":"MODERAÇÃO"}</span><strong>{item.platform}</strong><button type="button" onClick={()=>void navigator.clipboard.writeText(item.syntax).then(()=>{setCopiedModeratorCommand(item.id);window.setTimeout(()=>setCopiedModeratorCommand(null),1600)})}>{copiedModeratorCommand===item.id?"COPIADO ✓":"COPIAR"}</button></article>)}</div></section>
        <section className="control-command-library"><header><div><b>BIBLIOTECA DE IDEIAS</b><p>Adicione um modelo ao editor, personalize a resposta e ative quando estiver pronto.</p></div><span>{botCommandPresets.length} MODELOS</span></header><div>{botCommandPresets.map((preset)=>{const exists=botCommands.some((item)=>item.command===preset.command);return <article key={preset.command}><small>{preset.category}</small><b>{preset.command}</b><p>{preset.description}</p><code>{preset.response_template}</code><button type="button" disabled={exists} onClick={()=>{const id=crypto.randomUUID();setBotCommands((items)=>[...items,{...preset,id,sort_order:items.length+100}]);setOpenBotCommandId(id);markFormDirty("bot-core");requestAreaChange("03-01")}}>{exists?"JÁ CADASTRADO":"+ ADICIONAR AO EDITOR"}</button></article>})}</div></section>
        <aside className="control-command-variable-guide"><b>VARIÁVEIS SEGURAS</b><span>{"{{display_name}}"} USUÁRIO</span><span>{"{{target}}"} ALVO</span><span>{"{{arguments}}"} TEXTO LIVRE</span><span>{"{{random_number}}"} NÚMERO 0–100</span><span>{"{{community_url}}"} LINK DA COMUNIDADE</span><span>{"{{rank}}"} / {"{{level}}"} PERFIL</span></aside>
      </section>}
      {selectedArea === "03-06" && <section className="control-command-builder">
        <div className="control-editor-heading"><div><small>03.06 / ARROBASRV / CONSTRUTOR</small><h2>CRIAR COMANDO</h2><p>Escolha o comportamento, escreva a personalidade e deixe o sistema cuidar das regras técnicas.</p></div><span>ENTRA EM REVISÃO</span></div>
        <section className="control-command-add-library"><header><div><b>COMANDOS QUE VOCÊ PODE ADICIONAR</b><p>Escolha um modelo para preencher o construtor ou comece do zero logo abaixo.</p></div><span>{botCommandPresets.length} SUGESTÕES</span></header><div>{botCommandPresets.map((preset)=><button type="button" key={preset.command} onClick={()=>setBotCommandDraft((item)=>({...item,command:preset.command,description:preset.description,response_template:preset.response_template,permission:preset.permission,cooldown_seconds:preset.cooldown_seconds,category:preset.category,command_type:"text",responses:[""]}))}><small>{preset.category}</small><b>{preset.command}</b><p>{preset.description}</p><span>USAR ESTE MODELO →</span></button>)}</div></section>
        <form data-control-form="command-builder" onSubmit={createDynamicBotCommand}>
          <fieldset><legend>01 / IDENTIDADE</legend><label>COMANDO<input value={botCommandDraft.command} pattern="^![a-z0-9_]+$" onChange={(event)=>setBotCommandDraft((item)=>({...item,command:event.target.value.toLowerCase()}))} placeholder="!exemplo" required /></label><label>CATEGORIA<select value={botCommandDraft.category} onChange={(event)=>setBotCommandDraft((item)=>({...item,category:event.target.value}))}><option value="community">COMUNIDADE</option><option value="fun">HUMOR</option><option value="games">BRINCADEIRAS</option><option value="utility">UTILIDADE</option><option value="moderation">MODERAÇÃO</option></select></label><label className="wide">O QUE ELE FAZ<input value={botCommandDraft.description} onChange={(event)=>setBotCommandDraft((item)=>({...item,description:event.target.value}))} placeholder="EXPLIQUE EM UMA FRASE" required /></label></fieldset>
          <fieldset><legend>02 / COMPORTAMENTO</legend><div className="control-command-type-grid">{[["text","RESPOSTA SIMPLES","Sempre envia a mesma estrutura."],["random","RESPOSTAS ALEATÓRIAS","Sorteia uma das respostas cadastradas."],["dice","DADO","Rola um dado; o usuário pode informar os lados."],["choice","ESCOLHA","Escolhe entre opções separadas por |."],["eight_ball","ORÁCULO","Responde perguntas com frases aleatórias."],["counter","CONTADOR DA COMUNIDADE","Mantém um único número compartilhado pelo canal."],["user_counter","CONTADOR POR USUÁRIO","Conta separadamente quantas vezes cada pessoa usou o comando no dia."]].map(([value,label,help])=><button className={botCommandDraft.command_type===value?"active":""} type="button" key={value} onClick={()=>setBotCommandDraft((item)=>({...item,command_type:value as NonNullable<BotCommand["command_type"]>,response_template:value==="user_counter"&&!item.response_template.includes("{{user_count}}")?`@{{display_name}} usou ${item.command||"!comando"} pela {{user_count}}ª vez hoje.`:item.response_template}))}><b>{label}</b><span>{help}</span></button>)}</div></fieldset>
          <fieldset><legend>03 / RESPOSTA</legend><label className="wide">RESPOSTA PRINCIPAL<textarea maxLength={500} value={botCommandDraft.response_template} onChange={(event)=>setBotCommandDraft((item)=>({...item,response_template:event.target.value}))} placeholder="@{{display_name}}, escreva a resposta do ArrobaSrv..." /></label>{botCommandDraft.command_type==="user_counter"&&<aside className="control-command-variable-guide"><b>CONTADOR INDIVIDUAL DIÁRIO</b><span>{"{{user_count}}"} NÚMERO DE USOS DO USUÁRIO HOJE</span><span>RESET: SEU COMANDO + RESET + @USUÁRIO</span></aside>}{["random","eight_ball"].includes(botCommandDraft.command_type)&&<div className="control-command-variant-editor"><b>VARIAÇÕES ALEATÓRIAS</b>{botCommandDraft.responses.map((response,index)=><label key={index}>RESPOSTA {String(index+1).padStart(2,"0")}<div><input value={response} onChange={(event)=>setBotCommandDraft((item)=>({...item,responses:item.responses.map((current,i)=>i===index?event.target.value:current)}))} /><button type="button" disabled={botCommandDraft.responses.length===1} onClick={()=>setBotCommandDraft((item)=>({...item,responses:item.responses.filter((_,i)=>i!==index)}))}>REMOVER</button></div></label>)}<button type="button" onClick={()=>setBotCommandDraft((item)=>({...item,responses:[...item.responses,""]}))}>+ ADICIONAR RESPOSTA</button></div>}<aside className="control-command-variable-guide"><b>INSIRA VARIÁVEIS</b><span>{"{{display_name}}"}</span><span>{"{{target}}"}</span><span>{"{{arguments}}"}</span><span>{"{{random_number}}"}</span><span>{"{{choice}}"}</span><span>{"{{counter_value}}"}</span><span>{"{{user_count}}"}</span></aside></fieldset>
          <fieldset><legend>04 / REGRAS</legend><label>QUEM PODE USAR<select value={botCommandDraft.permission} onChange={(event)=>setBotCommandDraft((item)=>({...item,permission:event.target.value as BotCommand["permission"]}))}><option value="everyone">TODOS</option><option value="follower">FOLLOWERS</option><option value="subscriber">SUBS</option><option value="moderator">MODERADORES</option><option value="broadcaster">THENEES</option></select></label><label>PLATAFORMA<select value={botCommandDraft.platform_scope} onChange={(event)=>setBotCommandDraft((item)=>({...item,platform_scope:event.target.value as NonNullable<BotCommand["platform_scope"]>}))}><option>BOTH</option><option>TWITCH</option><option>KICK</option></select></label><label>ESPERA POR USUÁRIO / SEG<input type="number" min="0" max="3600" value={botCommandDraft.cooldown_seconds} onChange={(event)=>setBotCommandDraft((item)=>({...item,cooldown_seconds:Number(event.target.value)}))} /></label><label>ESPERA GLOBAL / SEG<input type="number" min="0" max="3600" value={botCommandDraft.global_cooldown_seconds} onChange={(event)=>setBotCommandDraft((item)=>({...item,global_cooldown_seconds:Number(event.target.value)}))} /></label></fieldset>
          <div className="control-command-builder-review"><div><small>PRÉVIA</small><b>{botCommandDraft.command||"!comando"}</b><p>{botCommandDraft.response_template||botCommandDraft.responses.find(Boolean)||"A resposta aparecerá aqui."}</p><span>{botCommandDraft.command_type.toUpperCase()} · {botCommandDraft.permission.toUpperCase()} · {botCommandDraft.platform_scope}</span></div><aside><b>PUBLICAÇÃO SEGURA</b><p>O comando será criado desligado e com status de revisão. Depois, abra “Comandos cadastrados”, revise e ative.</p>{botCommandCreateState==="error"&&<em>REVISE OS CAMPOS OU APLIQUE PRIMEIRO A MIGRAÇÃO DO MOTOR DINÂMICO.</em>}{botCommandCreateState==="saved"&&<em className="saved">COMANDO CRIADO E ENVIADO PARA REVISÃO.</em>}<button type="submit" disabled={botCommandCreateState==="saving"}>{botCommandCreateState==="saving"?"CRIANDO...":"CRIAR E ENVIAR PARA REVISÃO →"}</button></aside></div>
        </form>
      </section>}
      {selectedArea === "03-07" && <section className="control-user-counter-panel"><div className="control-editor-heading"><div><small>03.07 / ARROBASRV</small><h2>CONTADORES POR USUÁRIO</h2><p>Acompanhe e reinicie os contadores individuais de todos os comandos configurados com esse comportamento.</p></div><span>{botUserCounters.length} REGISTROS HOJE</span></div><aside><b>CONTADORES INDIVIDUAIS LIVRES</b><p>Em “Adicionar comando”, escolha <code>Contador por usuário</code> e use <code>{"{{user_count}}"}</code> na mensagem. Cada comando mantém sua própria contagem diária.</p><button type="button" onClick={()=>requestAreaChange("03-06")}>CRIAR COMANDO COM CONTADOR →</button></aside><section><header><span>USUÁRIO / COMANDO</span><span>PLATAFORMA</span><span>USOS HOJE</span><span>ÚLTIMO USO</span><span /></header>{botUserCounters.length===0?<div className="control-community-empty">NENHUM CONTADOR INDIVIDUAL REGISTRADO HOJE.</div>:botUserCounters.map((counter)=>{const counterCommand=botCommands.find((item)=>item.id===counter.command_id)?.command??"COMANDO";return <article key={counter.id}><b>{counter.display_name||counter.username}<small>@{counter.username} · {counterCommand.toUpperCase()}</small></b><span>{counter.platform}</span><strong>{counter.value}×</strong><time>{new Date(counter.updated_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</time><button type="button" onClick={async()=>{if(!window.confirm(`Resetar ${counterCommand} para @${counter.username}?`))return;const {error}=await getSupabaseBrowserClient().from("bot_user_counters").delete().eq("id",counter.id);if(!error)setBotUserCounters((items)=>items.filter((item)=>item.id!==counter.id))}}>RESETAR</button></article>})}</section></section>}
      {selectedArea === "03-08" && <section className="control-bot-channels-page"><div className="control-editor-heading"><div><small>03.08 / ARROBASRV</small><h2>CANAIS & STATUS</h2><p>Concentre aqui apenas a conexão do ArrobaSrv com Twitch e Kick. Comandos e mensagens possuem áreas próprias.</p></div><span>{botChannels.filter((item)=>item.enabled).length} ADAPTADORES LIGADOS</span></div><form data-control-form="bot-channels" onSubmit={async(event)=>{event.preventDefault();setBotSaveState("saving");const {error}=await getSupabaseBrowserClient().from("bot_channels").upsert(botChannels.map((item)=>({...item,updated_at:new Date().toISOString()})));setBotSaveState(error?"error":"saved")}}><div>{botChannels.map((channel,index)=><article key={channel.platform}><header><div><small>PLATAFORMA</small><b>{channel.platform}</b></div><span className={channel.connection_status}>{channel.connection_status.toUpperCase()}</span></header><label>CANAL<input value={channel.channel_name} onChange={(event)=>setBotChannels((items)=>items.map((item,i)=>i===index?{...item,channel_name:event.target.value}:item))} /></label><label className="control-check"><input type="checkbox" checked={channel.enabled} onChange={(event)=>setBotChannels((items)=>items.map((item,i)=>i===index?{...item,enabled:event.target.checked,connection_status:event.target.checked?"configured":"disconnected"}:item))} /> HABILITAR ADAPTADOR</label><p>{channel.last_error||"Credenciais e tokens permanecem protegidos no servidor."}</p></article>)}</div><aside><div><b>STATUS DO ARROBASRV</b><span>TWITCH: {twitchIntegration?.status?.toUpperCase()||"PENDENTE"}</span><span>KICK: {kickIntegration?.status?.toUpperCase()||"PENDENTE"}</span></div><button type="button" onClick={()=>requestAreaChange("06-02")}>ABRIR INTEGRAÇÕES →</button><button type="submit" disabled={botSaveState==="saving"}>{botSaveState==="saving"?"SALVANDO...":"SALVAR CANAIS →"}</button></aside></form></section>}
    </section>
  </main>;
}
