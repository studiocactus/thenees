"use client";

import { useEffect, useState, type FormEvent } from "react";
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
type BotCommand = { id:string;command:string;description:string;response_template:string;permission:"everyone"|"follower"|"subscriber"|"moderator"|"broadcaster";cooldown_seconds:number;enabled:boolean;sort_order:number };
type BotAutomation = { event_key:string;label:string;message_template:string;target_platform:"TWITCH"|"KICK"|"BOTH";enabled:boolean;include_site_link:boolean };
type BotOutboxItem = { id:string;event_key:string;target_platform:string;status:string;attempts:number;created_at:string;last_error:string|null };
type PlatformIntegration = { platform:"TWITCH"|"KICK";status:string;channel_login:string|null;external_user_id:string|null;display_name:string|null;scopes:string[];eventsub_status:string;last_synced_at:string|null;last_error:string|null };
type ShortLink = { id:string;slug:string;label:string;destinationUrl:string;active:boolean;createdAt:string };

const defaultHeroContent: HeroContent = { eyebrow: "SISTEMA OPERACIONAL DA COMUNIDADE", version: "V.01 / 2026", titleLine1: "EU JOGO.", titleLine2Lead: "VOCÊS", titleLine2Accent: "INTERAGEM.", titleLine3: "FUNCIONA.", subtitle: "Twitch + Kick + Games + Comunidade", description: "Um lugar onde assistir à live é só o começo.", primaryLabel: "ASSISTIR AO VIVO", primaryHref: "#live", secondaryLabel: "CONHECER O GAME", secondaryHref: "#game" };
const defaultProfileItems: ProfileItem[] = [
  ["music","MÚSICA PREFERIDA","WITHOUT YOU","AVICII / SPOTIFY ↗","https://open.spotify.com/intl-pt/track/6Pgkp4qUoTmJIPn7ReaGxL?si=18d6bc45a881405f"], ["food","COMIDA","STROGONOFF DE FRANGO","BUFF DE ENERGIA FAVORITO",null], ["place","LUGAR","JAPÃO","PONTO DE SPAWN IDEAL",null], ["dream","SONHO","CONHECER O JAPÃO","MISSÃO PRINCIPAL",null], ["work","O QUE EU FAÇO","DIRETOR DE ARTE / STREAMER","CLASSE PROFISSIONAL",null], ["game","JOGO FAVORITO","ROCK N’ ROLL RACING","MEGA DRIVE / RESPONSÁVEL POR BOA PARTE DA PERSONALIDADE",null], ["skill","SKILL PRINCIPAL","DEITAR SEM SONO","HABILIDADE REALMENTE ÚTIL",null], ["project","PROJETO ATUAL","SER UM STREAMER MELHOR","QUEST ATIVA",null], ["fuel","COMBUSTÍVEL CRIATIVO","CONTATO HUMANO","RECURSO CONSUMIDO EM QUANTIDADES DUVIDOSAS",null], ["hobby","HOBBY FORA DA TELA","MTB","MODO OFFLINE",null], ["defect","DEFEITO DE FÁBRICA","DURMO POUCO","BUG CONHECIDO, PATCH NÃO PREVISTO",null], ["rule","REGRA PESSOAL","NÃO DESISTIR ATÉ CONSEGUIR","CÓDIGO-FONTE MORAL",null],
].map(([item_key,label,value,helper_text,link_url],index) => ({ item_key:item_key as string,label:label as string,value:value as string,helper_text:helper_text as string,link_url:link_url as string|null,sort_order:index+1,active:true }));

const navigationGroups = [
  { number: "00", title: "INÍCIO", items: [["01", "VISÃO GERAL"]] },
  { number: "01", title: "SITE", items: [["01", "PÁGINA INICIAL"], ["02", "TEXTOS E PERFIL"], ["03", "AGENDA E VÍDEOS"], ["04", "LINKS E REDES"]] },
  { number: "02", title: "CHATBATTLE", items: [["01", "CONFIGURAÇÕES"], ["02", "INCENTIVOS"], ["03", "JOGADORES"]] },
  { number: "03", title: "ARROBASRV", items: [["01", "EVENTOS DO CHAT"], ["02", "QUOTES"], ["03", "AUTOMAÇÕES"], ["04", "ENCURTADOR DE LINKS"]] },
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

const newScheduleEvent = (): ScheduleEvent => ({ starts_at:formatSaoPauloDateTimeInput(Date.now()+86400000),title:"NOVA LIVE",game:"A DEFINIR",platform:"TWITCH + KICK",description:"",published:true });
const defaultFeaturedVideo: FeaturedVideo = { title:"Melhores Momentos das Lives! #01",video_url:"https://www.youtube.com/watch?v=eiEJdsE7pNI",thumbnail_url:"https://i.ytimg.com/vi/eiEJdsE7pNI/maxresdefault.jpg",published:true,sort_order:1 };
const defaultSiteContent: SiteContent = { aboutText:"Thenees transforma live em playground. Aqui a comunidade não fica só olhando — ela vota, interfere, compete e, ocasionalmente, destrói qualquer chance de vitória.",gameText:"Um game persistente que nasce dentro do chat da live. Cada pessoa cria seu personagem, participa usando comandos e, quando a transmissão termina, continua a jornada em sua própria área de perfil.",communityText:"Uma comunidade construída para participar, criar memória e transformar cada transmissão em uma experiência coletiva.",partnersText:"Projetos criativos, conteúdo autêntico e uma comunidade que realmente participa. Vamos criar algo que as pessoas queiram assistir — e lembrar.",labText:"Bots, ferramentas para o chat, encurtador de links, integrações e ideias perigosamente próximas de virar produto.",footerTagline:"Streamer, criador e responsável por transformar interação em experiência.",footerBusinessText:"Parcerias, projetos, eventos e ideias perigosamente próximas de funcionar." };
const siteContentLabels:Record<keyof SiteContent,string> = { aboutText:"SOBRE / APRESENTAÇÃO",gameText:"O GAME / APRESENTAÇÃO",communityText:"COMUNIDADE / APRESENTAÇÃO",partnersText:"PARCERIAS / APRESENTAÇÃO",labText:"THENEES LAB / APRESENTAÇÃO",footerTagline:"RODAPÉ / ASSINATURA",footerBusinessText:"RODAPÉ / TEXTO COMERCIAL" };
const officialPlatformOptions = ["TWITCH","KICK","YOUTUBE","DISCORD","INSTAGRAM","TIKTOK","X / TWITTER","FACEBOOK","SPOTIFY","LINKEDIN"];
const defaultOfficialLinks: OfficialLinks = { twitch:"https://www.twitch.tv/thenees",kick:"https://kick.com/thenees",youtube:"https://www.youtube.com/@theneesr",discord:"https://discord.gg/fUEG3h2ED",email:"contato@theneees.com.br",community:"https://www.theneees.com.br/#comunidade",channels:[{platform:"TWITCH",url:"https://www.twitch.tv/thenees"},{platform:"KICK",url:"https://kick.com/thenees"},{platform:"YOUTUBE",url:"https://www.youtube.com/@theneesr"},{platform:"DISCORD",url:"https://discord.gg/fUEG3h2ED"}] };
const normalizeOfficialLinks = (value:Partial<OfficialLinks>):OfficialLinks => {
  const merged={...defaultOfficialLinks,...value};
  const channels=Array.isArray(value.channels)&&value.channels.length?value.channels:[{platform:"TWITCH",url:merged.twitch},{platform:"KICK",url:merged.kick},{platform:"YOUTUBE",url:merged.youtube},{platform:"DISCORD",url:merged.discord}];
  return {...merged,channels:channels.filter((item)=>item?.platform&&item?.url)};
};
const defaultCommunityMetrics: CommunityMetric[] = [
  {metric_key:"followers",label:"SEGUIDORES",value:"04.2K",helper_text:"TWITCH + KICK",source:"MANUAL",is_public:true},
  {metric_key:"active_subs",label:"SUBS ATIVOS",value:"0328",helper_text:"DADOS AUTORIZADOS",source:"MANUAL",is_public:true},
  {metric_key:"watch_hours",label:"HORAS ASSISTIDAS",value:"18.6K",helper_text:"CALCULADAS PELO SISTEMA",source:"MANUAL",is_public:true},
  {metric_key:"chaos_clips",label:"CLIPES DO CAOS",value:"01.3K",helper_text:"PROVAS DOCUMENTAIS",source:"MANUAL",is_public:true},
];
const defaultCommercialContent: CommercialContent = {coverEyebrow:"STREAMER · DIRETOR DE ARTE · CREATOR",coverTitle:"MARCAS ENTRAM. A COMUNIDADE JOGA.",coverDescription:"Conteúdo, live e experiências interativas construídas para serem vividas — não apenas assistidas.",aboutTitle:"THENEES",aboutText:"Streamer, Diretor de Arte e criador do ChatBattle. Transformo participação do chat em conteúdo, narrativa e experiências que aproximam pessoas e marcas.",differenceTitle:"O CHAT NÃO ASSISTE. ELE DECIDE.",differenceText:"No ChatBattle, a marca pode fazer parte da mecânica: ativar eventos, liberar missões coletivas e recompensar toda a comunidade sem comprar a vitória individual.",formats:[{title:"LIVE PATROCINADA",description:"Produto, desafio e narrativa integrados à transmissão."},{title:"BRANDED GAME",description:"Missões, criaturas e recompensas de marca no ChatBattle."},{title:"CONTEÚDO",description:"YouTube, cortes, redes sociais e campanhas com direção criativa."},{title:"EVENTOS",description:"Presença, cobertura e experiências participativas para a comunidade."}],partners:[{name:"NVIDIA",logo_url:"",active:true},{name:"AMD",logo_url:"",active:true},{name:"SAMSUNG",logo_url:"",active:true},{name:"FIFINE",logo_url:"",active:true},{name:"PARCEIRO 05",logo_url:"",active:true},{name:"SUA MARCA AQUI",logo_url:"",active:true}]};
const allControlAreas=navigationGroups.flatMap((group)=>group.items.map(([number])=>`${group.number}-${number}`));
const unavailableControlAreas=new Set(["02-01","02-02","02-03","04-03","06-03","07-01","07-02","07-03"]);
const roleAreas:Record<string,string[]>={owner:allControlAreas,admin:allControlAreas,editor:["00-01","01-01","01-02","01-03","01-04","04-01","05-01","05-02","05-03"],moderator:["00-01","02-01","02-02","02-03","03-01","03-02","03-03","03-04","04-02","04-03"]};

export default function ControlPage() {
  const [accessState, setAccessState] = useState<AccessState>(isSupabaseConfigured ? "loading" : "setup_required");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [backendTables, setBackendTables] = useState<BackendTable[]>(backendTableDefinitions.map(([label, table]) => ({ label, table, count: null })));
  const [heroContent, setHeroContent] = useState<HeroContent>(defaultHeroContent);
  const [heroSaveState, setHeroSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileItems, setProfileItems] = useState<ProfileItem[]>(defaultProfileItems);
  const [openContentKey, setOpenContentKey] = useState<keyof SiteContent | null>(null);
  const [openProfileKey, setOpenProfileKey] = useState<string | null>(null);
  const [profileSaveState, setProfileSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [selectedArea, setSelectedArea] = useState("00-01");
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
  const [contentSaveState, setContentSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [linksSaveState, setLinksSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [authMode, setAuthMode] = useState<"login"|"register">("login");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamInvite["role"]>("moderator");
  const [teamMessage, setTeamMessage] = useState("");
  const [communityMetrics, setCommunityMetrics] = useState<CommunityMetric[]>(defaultCommunityMetrics);
  const [communityQuotes, setCommunityQuotes] = useState<CommunityQuote[]>([]);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [birthdayPlayers, setBirthdayPlayers] = useState<BirthdayPlayer[]>([]);
  const [communitySaveState, setCommunitySaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [quoteDraft, setQuoteDraft] = useState<CommunityQuote>({quote_text:"",author_name:"",platform:"MANUAL",quoted_at:formatSaoPauloDateTimeInput(new Date()),approved:true,status:"approved",submitted_by:"THENEES CONTROL",bot_announced_at:null});
  const [commercialContent, setCommercialContent] = useState<CommercialContent>(defaultCommercialContent);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [commercialSaveState, setCommercialSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [botChannels, setBotChannels] = useState<BotChannel[]>([]);
  const [botCommands, setBotCommands] = useState<BotCommand[]>([]);
  const [openBotCommandId, setOpenBotCommandId] = useState<string | null>(null);
  const [openBotAutomationKey, setOpenBotAutomationKey] = useState<string | null>(null);
  const [botCommandSearch, setBotCommandSearch] = useState("");
  const [showBotVariables, setShowBotVariables] = useState(false);
  const [botAutomations, setBotAutomations] = useState<BotAutomation[]>([]);
  const [botOutbox, setBotOutbox] = useState<BotOutboxItem[]>([]);
  const [botSaveState, setBotSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [platformIntegrations, setPlatformIntegrations] = useState<PlatformIntegration[]>([]);
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([]);
  const [shortLinkDraft, setShortLinkDraft] = useState({ label:"",slug:"",destinationUrl:"" });
  const [shortLinkState, setShortLinkState] = useState<"idle"|"saving"|"saved"|"error">("idle");

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
    const [channels,commands,automations,outbox,links]=await Promise.all([
      supabase.from("bot_channels").select("platform,channel_name,enabled,connection_status,last_connected_at,last_error").order("platform"),
      supabase.from("bot_commands").select("id,command,description,response_template,permission,cooldown_seconds,enabled,sort_order").order("sort_order"),
      supabase.from("bot_automations").select("event_key,label,message_template,target_platform,enabled,include_site_link").order("event_key"),
      supabase.from("bot_outbox").select("id,event_key,target_platform,status,attempts,created_at,last_error").order("created_at",{ascending:false}).limit(30),
      supabase.from("short_links").select("id,slug,label,destination_url,active,created_at").order("created_at",{ascending:false}),
    ]);
    if(channels.data)setBotChannels(channels.data as BotChannel[]);
    if(commands.data)setBotCommands((commands.data as BotCommand[]).map((item)=>({...item,description:normalizeUtf8Text(item.description),response_template:normalizeUtf8Text(item.response_template)})));
    if(automations.data)setBotAutomations((automations.data as BotAutomation[]).map((item)=>({...item,label:normalizeUtf8Text(item.label),message_template:normalizeUtf8Text(item.message_template)})));
    if(outbox.data)setBotOutbox(outbox.data as BotOutboxItem[]);
    if(links.data)setShortLinks(links.data.map((item)=>({id:item.id,slug:item.slug,label:item.label,destinationUrl:item.destination_url,active:item.active,createdAt:item.created_at})) as ShortLink[]);
  };
  useEffect(()=>{if(accessState==="authorized"&&admin&&["owner","admin","moderator"].includes(admin.role))void loadBotCore();},[accessState,admin]);

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
    const {data}=await getSupabaseBrowserClient().from("platform_integrations").select("platform,status,channel_login,external_user_id,display_name,scopes,eventsub_status,last_synced_at,last_error").order("platform");
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
    event.preventDefault(); setLinksSaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("site_settings").upsert({ key:"official_links",value:officialLinks,is_public:true,updated_at:new Date().toISOString() });
    setLinksSaveState(error?"error":"saved");
    if(!error){const changedAt=Date.now().toString();window.localStorage.setItem("thenees-official-links-updated",changedAt);if("BroadcastChannel" in window){const channel=new BroadcastChannel("thenees-official-links");channel.postMessage(changedAt);channel.close();}}
  };

  const addOfficialChannel = () => {
    const url=officialPlatformUrl.trim();
    if(!url)return;
    const key=officialPlatform.toLowerCase().replace(" / twitter","") as "twitch"|"kick"|"youtube"|"discord";
    setOfficialLinks((current)=>{
      const channels=[...current.channels.filter((item)=>item.platform!==officialPlatform),{platform:officialPlatform,url}];
      return {...current,channels,...(["twitch","kick","youtube","discord"].includes(key)?{[key]:url}:{})};
    });
    setOfficialPlatformUrl("");setLinksSaveState("idle");
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
    setCommunitySaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("game_players").update({...changes,updated_at:new Date().toISOString()}).eq("id",player.id);
    if (error) setCommunitySaveState("error"); else { setCommunitySaveState("saved");notifyCommunityContentChange();await loadCommunity(); }
  };

  const handleCommercialSave = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();setCommercialSaveState("saving");
    const { error } = await getSupabaseBrowserClient().from("site_settings").upsert({key:"commercial_content",value:commercialContent,is_public:true,updated_at:new Date().toISOString()});
    setCommercialSaveState(error?"error":"saved");
    if(!error){const changedAt=Date.now().toString();window.localStorage.setItem("thenees-commercial-content-updated",changedAt);if("BroadcastChannel" in window){const channel=new BroadcastChannel("thenees-commercial-content");channel.postMessage(changedAt);channel.close();}}
  };

  const updateContactMessage = async (messageItem:ContactMessage,changes:Partial<Pick<ContactMessage,"status"|"admin_notes">>) => {
    setCommercialSaveState("saving");
    const next = {...changes,updated_at:new Date().toISOString(),...(changes.status==="replied"?{replied_at:new Date().toISOString()}:{})};
    const { error } = await getSupabaseBrowserClient().from("contact_messages").update(next).eq("id",messageItem.id);
    if(error)setCommercialSaveState("error");else{setCommercialSaveState("saved");await loadCommercial();}
  };

  const saveBotCore = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();setBotSaveState("saving");const supabase=getSupabaseBrowserClient();
    const [channels,commands,automations]=await Promise.all([
      supabase.from("bot_channels").upsert(botChannels.map((item)=>({...item,updated_at:new Date().toISOString()}))),
      supabase.from("bot_commands").upsert(botCommands.map((item)=>({...item,description:normalizeUtf8Text(item.description),response_template:normalizeUtf8Text(item.response_template),updated_at:new Date().toISOString()}))),
      supabase.from("bot_automations").upsert(botAutomations.map((item)=>({...item,label:normalizeUtf8Text(item.label),message_template:normalizeUtf8Text(item.message_template),updated_at:new Date().toISOString()}))),
    ]);
    setBotSaveState(channels.error||commands.error||automations.error?"error":"saved");
  };

  const updateAutomationOption = async (automation:BotAutomation, field:"enabled"|"include_site_link", value:boolean) => {
    setBotAutomations((items)=>items.map((item)=>item.event_key===automation.event_key?{...item,[field]:value}:item));
    setBotSaveState("saving");
    const {error}=await getSupabaseBrowserClient().from("bot_automations").update({[field]:value,updated_at:new Date().toISOString()}).eq("event_key",automation.event_key);
    if(error){setBotAutomations((items)=>items.map((item)=>item.event_key===automation.event_key?automation:item));setBotSaveState("error");}
    else setBotSaveState("saved");
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

  const queueBirthdays = async () => { setBotSaveState("saving");const {error}=await getSupabaseBrowserClient().rpc("queue_today_birthdays");if(error)setBotSaveState("error");else{setBotSaveState("saved");await loadBotCore();} };

  const connectTwitch = async () => {
    setIntegrationMessage("PREPARANDO AUTORIZAÇÃO TWITCH...");
    const {data,error}=await getSupabaseBrowserClient().functions.invoke("twitch-oauth-start");
    if(error||!data?.url)setIntegrationMessage(data?.error==="twitch_secrets_missing"?"CONFIGURE O CLIENT ID E O CLIENT SECRET DA TWITCH NAS FUNÇÕES DO SUPABASE.":"NÃO FOI POSSÍVEL INICIAR A AUTORIZAÇÃO.");else window.location.assign(data.url);
  };
  const subscribeTwitch = async () => { setIntegrationMessage("CRIANDO INSCRIÇÕES EVENTSUB...");const {data,error}=await getSupabaseBrowserClient().functions.invoke("twitch-subscribe");setIntegrationMessage(error||data?.error?"NÃO FOI POSSÍVEL ATIVAR TODOS OS EVENTOS.":"EVENTOS TWITCH ENVIADOS PARA VALIDAÇÃO.");await loadIntegrations(); };
  const testTwitchWorker = async () => { setIntegrationMessage("PROCESSANDO FILA TWITCH...");const {data,error}=await getSupabaseBrowserClient().functions.invoke("twitch-worker");setIntegrationMessage(error||data?.error?"WORKER TWITCH INDISPONÍVEL OU SEM AUTORIZAÇÃO.":`${data.processed} EVENTOS PROCESSADOS.`);await loadBotCore(); };
  const disconnectIntegration = async (platform:"TWITCH"|"KICK") => { setIntegrationMessage(`DESCONECTANDO ${platform}...`);const {error}=await getSupabaseBrowserClient().functions.invoke("platform-disconnect",{body:{platform}});setIntegrationMessage(error?"NÃO FOI POSSÍVEL DESCONECTAR.":`${platform} DESCONECTADA.`);await loadIntegrations();await loadBotCore(); };

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
    event.preventDefault(); setTeamMessage("ENVIANDO CONVITE...");
    const { data:userData } = await getSupabaseBrowserClient().auth.getUser();
    const { error } = await getSupabaseBrowserClient().from("admin_invites").insert({ email:inviteEmail.trim().toLowerCase(),role:inviteRole,invited_by:userData.user?.id });
    if (error) setTeamMessage(error.code === "23505" ? "JÁ EXISTE UM CONVITE ATIVO PARA ESTE E-MAIL." : "NÃO FOI POSSÍVEL CRIAR O CONVITE.");
    else { setTeamMessage("CONVITE CRIADO. ENVIE O LINK /CONTROL PARA A PESSOA.");setInviteEmail("");await loadTeam(); }
  };

  const updateMember = async (member:TeamMember, changes:Partial<Pick<TeamMember,"role"|"active">>) => {
    if(!admin||member.user_id===admin.user_id||member.role==="owner"||(changes.role==="owner"&&admin.role!=="owner")){setTeamMessage("ESSA ALTERAÇÃO É PROTEGIDA.");return;}
    setTeamMessage("ATUALIZANDO EQUIPE...");
    const { error } = await getSupabaseBrowserClient().from("admin_users").update({ ...changes,updated_at:new Date().toISOString() }).eq("user_id",member.user_id);
    setTeamMessage(error ? "NÃO FOI POSSÍVEL ATUALIZAR O ACESSO." : "ACESSO ATUALIZADO.");
    if (!error) await loadTeam();
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

  return <main className="control-dashboard control-dashboard-v2">
    <header><div className="control-login-brand">THENEES<span>°</span> CONTROL</div><div className="control-user-area"><div className="control-user-copy"><b>{admin?.display_name}</b><small>{admin?.role} / ACESSO ATIVO</small></div><span><i /> SISTEMA CONECTADO</span><button type="button" onClick={handleSignOut}>SAIR</button></div></header>
    <aside className="control-sidebar">
      <div className="control-sidebar-intro"><small>PAINEL DE CONTROLE</small><b>ORGANIZE O CAOS.</b></div>
      <nav aria-label="Áreas administrativas">
        {visibleGroups.map((group) => <section className={selectedArea.startsWith(`${group.number}-`) ? "active" : ""} key={group.number}>
          <button className="control-nav-category" type="button" disabled={group.items.every(([number])=>unavailableControlAreas.has(`${group.number}-${number}`))} onClick={() => {const firstAvailable=group.items.find(([number])=>!unavailableControlAreas.has(`${group.number}-${number}`));if(firstAvailable)setSelectedArea(`${group.number}-${firstAvailable[0]}`)}}><span>{group.number}</span><b>{group.title}</b><i>{group.items.every(([number])=>unavailableControlAreas.has(`${group.number}-${number}`))?"EM BREVE":selectedArea.startsWith(`${group.number}-`) ? "−" : "+"}</i></button>
          <div className="control-nav-children">{group.items.map(([number, title]) => {const area=`${group.number}-${number}`;const unavailable=unavailableControlAreas.has(area);return <button className={`${selectedArea === area ? "selected " : ""}${unavailable?"unavailable":""}`} type="button" disabled={unavailable} onClick={() => setSelectedArea(area)} key={area}><span>{number}</span>{title}{unavailable&&<small>EM BREVE</small>}</button>})}</div>
        </section>)}
      </nav>
      <div className="control-sidebar-footer"><a href="/">↗ VER SITE</a><span>V.01 / 2026</span></div>
    </aside>
    <section className="control-workspace">
      {selectedArea === "00-01" && <section className="control-command" aria-labelledby="command-title">
        <div className="control-command-heading"><div><small>00 / CENTRAL DE COMANDO</small><h1 id="command-title">BEM-VINDO AO<br /><em>THENEES CONTROL.</em></h1><p>Visão rápida do ecossistema, atividades da comunidade e sistemas que precisam da sua atenção.</p></div><div className="control-command-clock"><span>ACESSO</span><b>{admin?.role.toUpperCase()}</b><small>SESSÃO PROTEGIDA</small></div></div>
        <nav className="control-quick-actions" aria-label="Ações rápidas"><span>AÇÕES RÁPIDAS</span><button type="button" onClick={()=>setSelectedArea("01-03")}>+ AGENDAR LIVE</button><button type="button" onClick={()=>setSelectedArea("03-04")}>+ CRIAR LINK</button><button type="button" onClick={()=>setSelectedArea("03-02")}>+ ADICIONAR QUOTE</button><button type="button" onClick={()=>setSelectedArea("05-03")}>ABRIR MENSAGENS</button></nav>
        <div className="control-command-metrics"><article><span>PRÓXIMAS LIVES</span><b>{dashboardStats.schedule ?? "--"}</b><small>EVENTOS NA AGENDA</small></article><article><span>QUOTES SALVAS</span><b>{dashboardStats.quotes ?? "--"}</b><small>ARQUIVO DA COMUNIDADE</small></article><article className={(dashboardStats.messages ?? 0) > 0 ? "attention" : ""}><span>NOVAS MENSAGENS</span><b>{dashboardStats.messages ?? "--"}</b><small>CAIXA DE ENTRADA</small></article><article><span>ITENS DO PERFIL</span><b>{dashboardStats.profile ?? "--"}</b><small>CONTEÚDO PUBLICADO</small></article><article><span>JOGADORES CADASTRADOS</span><b>{dashboardStats.players ?? "--"}</b><small>CONTAS ATIVAS NO CHATBATTLE</small></article><article className={(dashboardStats.activePlayers ?? 0) > 0 ? "attention" : ""}><span>JOGANDO AGORA</span><b>{dashboardStats.activePlayers ?? "--"}</b><small>ATIVOS NOS ÚLTIMOS 5 MINUTOS</small></article></div>
        <div className="control-command-grid">
          <section className="control-system-board"><header><b>STATUS DOS SISTEMAS</b><span>MONITORAMENTO INICIAL</span></header><div className="control-system-row online"><i /><span><b>SITE PÚBLICO</b><small>Landing e conteúdo editorial</small></span><strong>ONLINE</strong></div><div className="control-system-row online"><i /><span><b>SUPABASE</b><small>Banco, autenticação e políticas</small></span><strong>CONECTADO</strong></div><div className="control-system-row pending"><i /><span><b>ARROBASRV / TWITCH</b><small>Comandos, eventos e anúncios</small></span><strong>PENDENTE</strong></div><div className="control-system-row pending"><i /><span><b>ARROBASRV / KICK</b><small>Comandos, eventos e anúncios</small></span><strong>PENDENTE</strong></div><div className="control-system-row offline"><i /><span><b>LIVE STATUS</b><small>Detecção automática de transmissão</small></span><strong>OFFLINE</strong></div></section>
          <section className="control-game-board"><header><b>{gameName.toUpperCase()}</b><span>GAME CORE</span></header><div className="control-game-logo">CB<span>_01</span></div><h2>O CHAT É<br />O CONTROLE.</h2><p>A estrutura do game está conectada. Eventos de follow, sub, bits e donate entram na próxima etapa.</p><div><span>AMBIENTE</span><b>DESENVOLVIMENTO</b></div><div><span>BOT ENGINE</span><b className="pending">AGUARDANDO</b></div><div className="control-player-status"><span>PRESENÇA</span><b>{(dashboardStats.activePlayers ?? 0) > 0 ? `${dashboardStats.activePlayers} EM PARTIDA / ONLINE` : "NENHUM JOGADOR ATIVO"}</b></div></section>
          <section className="control-attention-board"><header><b>ATENÇÃO DO ADMIN</b><span>PRIORIDADES</span></header><article><span>01</span><div><b>CONECTAR TWITCH E KICK</b><p>Necessário para status da live, métricas e eventos do bot.</p></div></article><article><span>02</span><div><b>CONFIGURAR ARROBASRV</b><p>Autenticação, comandos e mensagens automáticas.</p></div></article><article><span>03</span><div><b>PUBLICAR AGENDA REAL</b><p>Defina horários, jogos, títulos e plataformas.</p></div></article></section>
        </div>
      </section>}
      {selectedArea === "01-01" && <section className="control-editor" id="area-01" aria-labelledby="hero-editor-title">
        <div className="control-editor-heading"><div><small>01 / CONTEÚDO DO SITE</small><h2 id="hero-editor-title">EDITOR DA HERO</h2><p>Altere a mensagem principal sem tocar no layout, nos efeitos ou na imagem ASCII.</p></div><span>HOME / PRIMEIRA DOBRA</span></div>
        <form onSubmit={handleHeroSave}>
          <fieldset><legend>IDENTIFICAÇÃO</legend><label>TEXTO SUPERIOR<input value={heroContent.eyebrow} onChange={(event) => updateHeroField("eyebrow", event.target.value)} required /></label><label>VERSÃO<input value={heroContent.version} onChange={(event) => updateHeroField("version", event.target.value)} required /></label></fieldset>
          <fieldset className="control-editor-title-fields"><legend>TÍTULO PRINCIPAL</legend><label>LINHA 01<input value={heroContent.titleLine1} onChange={(event) => updateHeroField("titleLine1", event.target.value)} required /></label><label>LINHA 02 — INÍCIO<input value={heroContent.titleLine2Lead} onChange={(event) => updateHeroField("titleLine2Lead", event.target.value)} required /></label><label>LINHA 02 — DESTAQUE<input value={heroContent.titleLine2Accent} onChange={(event) => updateHeroField("titleLine2Accent", event.target.value)} required /></label><label>LINHA 03<input value={heroContent.titleLine3} onChange={(event) => updateHeroField("titleLine3", event.target.value)} required /></label></fieldset>
          <fieldset><legend>APRESENTAÇÃO</legend><label>SUBTÍTULO<input value={heroContent.subtitle} onChange={(event) => updateHeroField("subtitle", event.target.value)} required /></label><label>DESCRIÇÃO<input value={heroContent.description} onChange={(event) => updateHeroField("description", event.target.value)} required /></label></fieldset>
          <fieldset className="control-editor-buttons"><legend>BOTÕES</legend><label>BOTÃO PRIMÁRIO<input value={heroContent.primaryLabel} onChange={(event) => updateHeroField("primaryLabel", event.target.value)} required /></label><label>DESTINO<input value={heroContent.primaryHref} onChange={(event) => updateHeroField("primaryHref", event.target.value)} required /></label><label>BOTÃO SECUNDÁRIO<input value={heroContent.secondaryLabel} onChange={(event) => updateHeroField("secondaryLabel", event.target.value)} required /></label><label>DESTINO<input value={heroContent.secondaryHref} onChange={(event) => updateHeroField("secondaryHref", event.target.value)} required /></label></fieldset>
          <div className="control-editor-actions"><p>{heroSaveState === "saved" ? "ALTERAÇÕES PUBLICADAS COM SUCESSO." : heroSaveState === "error" ? "ERRO AO SALVAR. TENTE NOVAMENTE." : "O SITE USA OS ÚLTIMOS DADOS PUBLICADOS."}</p><a href="/#home" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit" disabled={heroSaveState === "saving"}>{heroSaveState === "saving" ? "PUBLICANDO..." : "SALVAR E PUBLICAR →"}</button></div>
        </form>
      </section>}
      {selectedArea === "01-02" && <section className="control-editor control-profile-editor" id="area-01-02" aria-labelledby="profile-editor-title">
        <div className="control-editor-heading"><div><small>01.02 / PÁGINAS E TEXTOS</small><h2 id="profile-editor-title">THENEES_PROFILE.DAT</h2><p>Edite informações pessoais e profissionais mantendo o humor e a identidade do inventário.</p></div><span>{profileItems.length} ITENS ATIVOS</span></div>
        <form className="control-content-form" onSubmit={handleContentSave}>
          <div className="control-compact-list-heading"><span>ÁREA</span><span>CONTEÚDO ATUAL</span><span /></div>
          <div className="control-compact-list">{(Object.entries(siteContent) as [keyof SiteContent,string][]).map(([key,value],index) => { const isOpen=openContentKey===key;return <article className={isOpen?"open":""} key={key}><button className="control-compact-summary" type="button" aria-expanded={isOpen} aria-controls={`content-${key}`} onClick={()=>setOpenContentKey(isOpen?null:key)}><small>{String(index+1).padStart(2,"0")}</small><b>{siteContentLabels[key]}</b><span>{value}</span><i className={isOpen?"open":""} aria-hidden="true" /></button>{isOpen&&<div className="control-compact-editor" id={`content-${key}`}><label>TEXTO PUBLICADO<textarea value={value} onChange={(event) => { setSiteContent((current) => ({ ...current,[key]:event.target.value }));setContentSaveState("idle"); }} required /></label></div>}</article>})}</div>
          <div className="control-editor-actions"><p>{contentSaveState === "saved" ? "TEXTOS PUBLICADOS." : contentSaveState === "error" ? "ERRO AO PUBLICAR TEXTOS." : "ABRA UMA LINHA PARA EDITAR. ESTES TEXTOS APARECEM NAS PRINCIPAIS SEÇÕES DO SITE."}</p><button type="submit" disabled={contentSaveState === "saving"}>{contentSaveState === "saving" ? "PUBLICANDO..." : "SALVAR TEXTOS →"}</button></div>
        </form>
        <form onSubmit={handleProfileSave}>
          <div className="control-profile-divider"><b>ITENS DO PERFIL</b><span>RÓTULO · CONTEÚDO · TEXTO AUXILIAR</span></div>
          <div className="control-compact-list-heading profile"><span>ITEM</span><span>CONTEÚDO ATUAL</span><span /></div>
          <div className="control-compact-list control-profile-list">{profileItems.map((item,index) => { const isOpen=openProfileKey===item.item_key;return <article className={isOpen?"open":""} key={item.item_key}><button className="control-compact-summary" type="button" aria-expanded={isOpen} aria-controls={`profile-${item.item_key}`} onClick={()=>setOpenProfileKey(isOpen?null:item.item_key)}><small>{String(index+1).padStart(2,"0")}</small><b>{item.label}</b><span>{item.value}</span><i className={isOpen?"open":""} aria-hidden="true" /></button>{isOpen&&<fieldset className="control-compact-editor" id={`profile-${item.item_key}`}><label>RÓTULO<input value={item.label} onChange={(event) => updateProfileItem(index,"label",event.target.value)} required /></label><label>CONTEÚDO<input value={item.value} onChange={(event) => updateProfileItem(index,"value",event.target.value)} required /></label><label className="wide">TEXTO AUXILIAR<input value={item.helper_text} onChange={(event) => updateProfileItem(index,"helper_text",event.target.value)} required /></label>{item.item_key === "music" && <label className="wide">LINK EXTERNO<input type="url" value={item.link_url ?? ""} onChange={(event) => updateProfileItem(index,"link_url",event.target.value)} /></label>}</fieldset>}</article>})}</div>
          <div className="control-editor-actions"><p>{profileSaveState === "saved" ? "PERFIL PUBLICADO COM SUCESSO." : profileSaveState === "error" ? "ERRO AO SALVAR O PERFIL." : "A ORDEM DOS ITENS ESTÁ PROTEGIDA NESTA FASE."}</p><a href="/#sobre" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit" disabled={profileSaveState === "saving"}>{profileSaveState === "saving" ? "PUBLICANDO..." : "SALVAR PERFIL →"}</button></div>
        </form>
      </section>}
      {selectedArea === "01-03" && <section className="control-editor control-schedule-editor" aria-labelledby="schedule-editor-title">
        <div className="control-editor-heading"><div><small>01.03 / CONTEÚDO DO SITE</small><h2 id="schedule-editor-title">AGENDA & VÍDEOS</h2><p>Defina o que será transmitido e escolha o vídeo editorial exibido no site.</p></div><span>{scheduleEvents.length} EVENTOS / 01 DESTAQUE</span></div>
        <form onSubmit={handleScheduleSave}>
          <section className="control-schedule-list"><header><div><b>AGENDA DE TRANSMISSÕES</b><small>FUSO PADRÃO / AMERICA_SAO_PAULO</small></div><button type="button" onClick={() => {setScheduleEvents((items) => [...items,newScheduleEvent()]);setSavedScheduleIndex(null)}}>+ ADICIONAR LIVE</button></header>{scheduleEvents.map((item,index) => <article className="control-schedule-row" key={item.id ?? `new-${index}`}><div className="control-schedule-index">LIVE_{String(index+1).padStart(2,"0")}</div><label>DATA E HORÁRIO<input type="datetime-local" value={item.starts_at} onChange={(event) => updateScheduleEvent(index,"starts_at",event.target.value)} required /></label><label>PLATAFORMA<select value={item.platform} onChange={(event) => updateScheduleEvent(index,"platform",event.target.value)}><option>TWITCH</option><option>KICK</option><option>TWITCH + KICK</option></select></label><label>TÍTULO<input value={item.title} onChange={(event) => updateScheduleEvent(index,"title",event.target.value)} required /></label><label>JOGO<input value={item.game} onChange={(event) => updateScheduleEvent(index,"game",event.target.value)} /></label><label className="wide">DESCRIÇÃO<input value={item.description} onChange={(event) => updateScheduleEvent(index,"description",event.target.value)} /></label><label className="control-check"><input type="checkbox" checked={item.published} onChange={(event) => updateScheduleEvent(index,"published",event.target.checked)} /> PUBLICAR NO SITE</label><div className="control-schedule-actions"><button className="control-remove" type="button" onClick={() => void removeScheduleEvent(index)}>REMOVER</button><button className="control-save-live" type="button" disabled={savingScheduleIndex===index} onClick={() => void saveScheduleEvent(index)}>{savingScheduleIndex===index?"SALVANDO...":savedScheduleIndex===index?"LIVE SALVA ✓":"SALVAR LIVE →"}</button></div></article>)}</section>
          <fieldset className="control-video-fields"><legend>VÍDEO EM DESTAQUE</legend><label>TÍTULO<input value={featuredVideo.title} onChange={(event) => setFeaturedVideo((item) => ({ ...item,title:event.target.value }))} required /></label><label>LINK DO YOUTUBE<input type="url" value={featuredVideo.video_url} onChange={(event) => setFeaturedVideo((item) => ({ ...item,video_url:event.target.value }))} required /></label><label className="wide">CAPA PERSONALIZADA <small>OPCIONAL; SE VAZIO, O YOUTUBE SERÁ USADO</small><input type="url" value={featuredVideo.thumbnail_url} onChange={(event) => setFeaturedVideo((item) => ({ ...item,thumbnail_url:event.target.value }))} /></label><label className="control-check"><input type="checkbox" checked={featuredVideo.published} onChange={(event) => setFeaturedVideo((item) => ({ ...item,published:event.target.checked }))} /> EXIBIR NO SITE</label></fieldset>
          <div className="control-editor-actions"><p>{scheduleSaveState === "saved" ? "AGENDA E VÍDEO PUBLICADOS." : scheduleSaveState === "error" ? "ERRO AO SALVAR. REVISE OS CAMPOS." : "ALTERAÇÕES SÓ APARECEM NO SITE APÓS SALVAR."}</p><a href="/#live" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit" disabled={scheduleSaveState === "saving"}>{scheduleSaveState === "saving" ? "PUBLICANDO..." : "SALVAR AGENDA E VÍDEO →"}</button></div>
        </form>
      </section>}
      {selectedArea === "01-04" && <section className="control-editor control-links-editor" aria-labelledby="links-editor-title"><div className="control-editor-heading"><div><small>01.04 / CONTEÚDO DO SITE</small><h2 id="links-editor-title">LINKS OFICIAIS</h2><p>Escolha a plataforma, informe o endereço e reutilize o canal em toda a landing page.</p></div><span>{String(officialLinks.channels.length).padStart(2,"0")} CANAIS</span></div><form onSubmit={handleLinksSave}><fieldset><legend>ADICIONAR OU ATUALIZAR PLATAFORMA</legend><label>PLATAFORMA<select value={officialPlatform} onChange={(event)=>setOfficialPlatform(event.target.value)}>{officialPlatformOptions.map((platform)=><option key={platform}>{platform}</option>)}</select></label><label>LINK DA PLATAFORMA<input type="url" value={officialPlatformUrl} onChange={(event)=>setOfficialPlatformUrl(event.target.value)} placeholder="https://" /></label><button className="control-add-channel" type="button" onClick={addOfficialChannel}>+ ADICIONAR À LISTA</button></fieldset><div className="control-official-channel-list">{officialLinks.channels.map((channel)=><article key={channel.platform}><b>{channel.platform}</b><a href={channel.url} target="_blank" rel="noreferrer">{channel.url}</a><button type="button" onClick={()=>{setOfficialPlatform(channel.platform);setOfficialPlatformUrl(channel.url)}}>EDITAR</button><button className="danger" type="button" onClick={()=>{setOfficialLinks((current)=>({...current,channels:current.channels.filter((item)=>item.platform!==channel.platform)}));setLinksSaveState("idle")}}>REMOVER</button></article>)}</div><fieldset><legend>DESTINOS INSTITUCIONAIS</legend><label>E-MAIL OFICIAL<input type="email" value={officialLinks.email} onChange={(event)=>{setOfficialLinks((current)=>({...current,email:event.target.value}));setLinksSaveState("idle")}} required /></label><label>LINK DA COMUNIDADE<input type="url" value={officialLinks.community} onChange={(event)=>{setOfficialLinks((current)=>({...current,community:event.target.value}));setLinksSaveState("idle")}} required /></label></fieldset><div className="control-editor-actions"><p>{linksSaveState === "saved" ? "LINKS PUBLICADOS EM TODO O SITE." : linksSaveState === "error" ? "ERRO AO SALVAR LINKS." : "A LISTA SERÁ USADA NO FOOTER, PARCERIAS E BOTÕES DAS PLATAFORMAS."}</p><a href="/" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit" disabled={linksSaveState === "saving"}>{linksSaveState === "saving" ? "PUBLICANDO..." : "SALVAR LINKS →"}</button></div></form></section>}
      {(admin?.role === "owner" || admin?.role === "admin") && selectedArea === "06-01" && <section className="control-team" aria-labelledby="team-title"><div className="control-editor-heading"><div><small>06.01 / ADMINISTRAÇÃO</small><h2 id="team-title">EQUIPE & ACESSOS</h2><p>Convide colaboradores e defina exatamente o que cada pessoa pode administrar.</p></div><span>{teamMembers.filter((item) => item.active).length} ACESSOS ATIVOS</span></div><div className="control-role-guide"><article><b>OWNER</b><p>Controle completo e decisões críticas.</p></article><article><b>ADMIN</b><p>Equipe, conteúdo, comunidade e sistemas.</p></article><article><b>EDITOR</b><p>Site, agenda, vídeos e área comercial.</p></article><article><b>MODERADOR</b><p>ChatBattle, ArrobaSrv e comunidade.</p></article></div><form className="control-invite-form" onSubmit={handleInvite}><label>E-MAIL DO CONVIDADO<input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required placeholder="PESSOA@EMAIL.COM" /></label><label>FUNÇÃO<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as TeamInvite["role"])}><option value="moderator">MODERADOR</option><option value="editor">EDITOR</option><option value="admin">ADMIN</option></select></label><button type="submit">CRIAR CONVITE →</button></form>{teamMessage && <div className="control-team-message">{teamMessage}</div>}<section className="control-team-list"><header><b>EQUIPE ATUAL</b><span>PERMISSÕES EM TEMPO REAL</span></header>{teamMembers.map((member) => <article key={member.user_id}><div><strong>{member.display_name}</strong><small>{member.email}</small></div><select value={member.role} disabled={member.role === "owner"} onChange={(event) => void updateMember(member,{role:event.target.value as TeamMember["role"]})}><option value="owner">OWNER</option><option value="admin">ADMIN</option><option value="editor">EDITOR</option><option value="moderator">MODERADOR</option></select><button className={member.active ? "active" : ""} disabled={member.role === "owner"} type="button" onClick={() => void updateMember(member,{active:!member.active})}>{member.active ? "ATIVO" : "SUSPENSO"}</button></article>)}</section><section className="control-invite-list"><header><b>CONVITES</b><span>O CONVIDADO DEVE CRIAR A CONTA COM O MESMO E-MAIL</span></header>{teamInvites.map((invite) => <article key={invite.id}><span>{invite.email}<small>{new Date(invite.created_at).toLocaleDateString("pt-BR")}</small></span><b>{invite.role.toUpperCase()}</b><em>{invite.accepted_at ? "ACEITO" : invite.active ? "PENDENTE" : "ENCERRADO"}</em></article>)}</section></section>}
      {!selectedArea.startsWith("07-") && !["00-01","01-01","01-02","01-03","01-04","03-01","03-02","03-03","03-04","04-01","04-02","05-01","05-02","05-03","06-01","06-02"].includes(selectedArea) && <section className="control-empty-state"><small>{selectedGroup?.number} / {selectedGroup?.title}</small><span>MODULE_{selectedArea.replace("-", "_")}</span><h1>{selectedItem?.[1]}</h1><p>Esta área já está organizada na arquitetura do Control e será conectada aos dados na próxima etapa.</p><b>ESTRUTURA PREPARADA</b></section>}
      {(admin?.role === "owner" || admin?.role === "admin") && selectedArea.startsWith("07-") && <section className="control-backend" id="area-07" aria-labelledby="backend-title">
        <div className="control-backend-heading"><div><small>07 / ACESSO AVANÇADO</small><h2 id="backend-title">BACKEND & DADOS</h2><p>Saúde da infraestrutura, volume das tabelas e pontos críticos do ecossistema Thenees.</p></div><span><i /> OPERAÇÃO NORMAL</span></div>
        <div className="control-backend-health">
          <article><span>BANCO DE DADOS</span><b>CONNECTED</b><small>SUPABASE / POSTGRES</small></article>
          <article><span>SEGURANÇA</span><b>RLS ACTIVE</b><small>POLÍTICAS POR PERFIL</small></article>
          <article><span>AUTENTICAÇÃO</span><b>ONLINE</b><small>SESSÃO PROTEGIDA</small></article>
          <article><span>TABELAS GERENCIADAS</span><b>{backendTables.length.toString().padStart(2, "0")}</b><small>SCHEMA PUBLIC</small></article>
        </div>
        <div className="control-backend-grid">
          <section id="area-07-02"><header><b>TABELAS & REGISTROS</b><span>CONTAGEM AO VIVO</span></header>{backendTables.map((item) => <div className="control-table-row" key={item.table}><span>{item.label}<small>{item.table}</small></span><b>{item.count === null ? "..." : item.count.toString().padStart(2, "0")}</b></div>)}</section>
          <aside id="area-07-03"><header><b>CONTROLES AVANÇADOS</b><span>OWNER / ADMIN</span></header><div><b>ACESSOS DA EQUIPE</b><p>Perfis, permissões e suspensão de usuários administrativos.</p><span>EM PREPARAÇÃO →</span></div><div><b>HISTÓRICO DE ALTERAÇÕES</b><p>Auditoria de quem alterou conteúdos e configurações.</p><span>PRÓXIMA FASE →</span></div><div className="control-backend-warning"><b>ZONA PROTEGIDA</b><p>Chaves privadas, SQL arbitrário e credenciais nunca serão expostos no navegador.</p></div></aside>
        </div>
      </section>}
      {selectedArea === "04-01" && <section className="control-community"><div className="control-editor-heading"><div><small>04.01 / COMUNIDADE & LIVE</small><h2>MÉTRICAS PÚBLICAS</h2><p>Controle os quatro indicadores públicos e preserve um valor manual enquanto Twitch e Kick não estiverem conectadas.</p></div><span>04 BLOCOS</span></div><form onSubmit={handleMetricsSave}><div className="control-metric-editor">{communityMetrics.map((metric,index)=><fieldset key={metric.metric_key}><legend>METRIC_{String(index+1).padStart(2,"0")}</legend><label>RÓTULO<input value={metric.label} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,label:event.target.value}:item))} /></label><label>VALOR<input value={metric.value} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,value:event.target.value}:item))} /></label><label>AUXILIAR<input value={metric.helper_text} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,helper_text:event.target.value}:item))} /></label><label>ORIGEM<select value={metric.source} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,source:event.target.value}:item))}><option>MANUAL</option><option>TWITCH</option><option>KICK</option><option>TWITCH + KICK</option><option>SISTEMA</option></select></label><label className="control-check"><input type="checkbox" checked={metric.is_public} onChange={(event)=>setCommunityMetrics((items)=>items.map((item,i)=>i===index?{...item,is_public:event.target.checked}:item))} /> EXIBIR</label></fieldset>)}</div><div className="control-editor-actions"><p>{communitySaveState==="saved"?"MÉTRICAS PUBLICADAS.":communitySaveState==="error"?"ERRO AO SALVAR.":"FALLBACK MANUAL ATIVO."}</p><a href="/#comunidade" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit">SALVAR MÉTRICAS →</button></div></form></section>}
      {selectedArea === "03-02" && <section className="control-community"><div className="control-editor-heading"><div><small>03.02 / ARROBASRV</small><h2>ARQUIVO DE QUOTES</h2><p>Admin e moderadores podem criar, corrigir, publicar ou excluir quotes. No chat, use o número exibido em cada linha.</p></div><span>{communityQuotes.filter((quote)=>quote.status==="approved").length} PUBLICADAS</span></div><form className="control-quote-create" onSubmit={handleQuoteCreate}><label className="wide">FRASE<textarea value={quoteDraft.quote_text} onChange={(event)=>setQuoteDraft((item)=>({...item,quote_text:event.target.value}))} required /></label><label>USUÁRIO<input value={quoteDraft.author_name} onChange={(event)=>setQuoteDraft((item)=>({...item,author_name:event.target.value}))} required /></label><label>PLATAFORMA<select value={quoteDraft.platform} onChange={(event)=>setQuoteDraft((item)=>({...item,platform:event.target.value as CommunityQuote["platform"]}))}><option>TWITCH</option><option>KICK</option><option>MANUAL</option></select></label><label>DATA<input type="datetime-local" value={quoteDraft.quoted_at} onChange={(event)=>setQuoteDraft((item)=>({...item,quoted_at:event.target.value}))} /></label><label>PUBLICAÇÃO<select value={quoteDraft.status} onChange={(event)=>setQuoteDraft((item)=>({...item,status:event.target.value as CommunityQuote["status"]}))}><option value="approved">APROVAR AGORA</option><option value="pending">PENDENTE</option></select></label><button type="submit">ADICIONAR QUOTE →</button></form><aside className="control-quote-chat-help"><b>EDIÇÃO PELO CHAT / SOMENTE MODERAÇÃO</b><span>!editquote NÚMERO NOVA FRASE</span><span>!delquote NÚMERO</span></aside><div className="control-quote-table-head"><span>ID</span><span>QUOTE</span><span>AUTOR</span><span>STATUS</span><span /></div><div className="control-quote-list">{communityQuotes.map((quote,index)=>{const isOpen=openQuoteId===quote.id;return <article className={`control-command-accordion${isOpen?" open":""}`} key={quote.id}><button className="control-quote-summary" type="button" aria-expanded={isOpen} aria-controls={`quote-${quote.id}`} onClick={()=>setOpenQuoteId(isOpen?null:quote.id??null)}><strong>#{quote.quote_number??"--"}</strong><blockquote>“{quote.quote_text}”</blockquote><b>— {quote.author_name}</b><em>{quote.status.toUpperCase()}</em><i>{isOpen?"−":"⌄"}</i></button>{isOpen&&<fieldset id={`quote-${quote.id}`}><label className="wide">FRASE<textarea value={quote.quote_text} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,quote_text:event.target.value}:item))} /></label><label>USUÁRIO<input value={quote.author_name} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,author_name:event.target.value}:item))} /></label><label>PLATAFORMA<select value={quote.platform} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,platform:event.target.value as CommunityQuote["platform"]}:item))}><option>TWITCH</option><option>KICK</option><option>MANUAL</option></select></label><label>DATA<input type="datetime-local" value={new Date(quote.quoted_at).toISOString().slice(0,16)} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,quoted_at:event.target.value}:item))} /></label><label>PUBLICAÇÃO<select value={quote.status} onChange={(event)=>setCommunityQuotes((items)=>items.map((item,i)=>i===index?{...item,status:event.target.value as CommunityQuote["status"]}:item))}><option value="pending">PENDENTE</option><option value="approved">PUBLICADA</option><option value="rejected">REJEITADA</option><option value="archived">ARQUIVADA</option></select></label><div className="control-quote-actions"><button className="danger" type="button" onClick={()=>void deleteQuote(quote)}>EXCLUIR QUOTE</button><button type="button" onClick={()=>void saveQuote(quote)}>SALVAR ALTERAÇÕES →</button></div></fieldset>}</article>})}</div><div className="control-editor-actions"><p>{communitySaveState==="saved"?"ARQUIVO DE QUOTES ATUALIZADO.":communitySaveState==="error"?"ERRO AO SALVAR A QUOTE.":"ALTERAÇÕES SÃO PUBLICADAS APÓS SALVAR."}</p></div></section>}
      {selectedArea === "04-02" && <section className="control-community"><div className="control-editor-heading"><div><small>04.02 / COMUNIDADE & LIVE</small><h2>ANIVERSÁRIOS</h2><p>Jogadores cadastrados entram automaticamente. O aviso prepara a celebração no site e a mensagem do ArrobaSrv.</p></div><span>{birthdayPlayers.filter((player)=>player.birthday_party_enabled).length} AVISOS LIGADOS</span></div><div className="control-birthday-list">{birthdayPlayers.length===0?<div className="control-community-empty">NENHUM JOGADOR COM ANIVERSÁRIO CADASTRADO.</div>:birthdayPlayers.map((player)=><article key={player.id}><div className="control-birthday-player"><b>{player.display_name||player.username}</b><small>@{player.username} · {player.platform} · {player.birthday?new Date(`${player.birthday}T12:00:00`).toLocaleDateString("pt-BR"):"--"}</small></div><label className="control-birthday-message">MENSAGEM DO BOT<input value={player.birthday_message??""} onBlur={(event)=>void updateBirthday(player,{birthday_message:event.target.value||null})} onChange={(event)=>setBirthdayPlayers((items)=>items.map((item)=>item.id===player.id?{...item,birthday_message:event.target.value}:item))} /></label><button className={`control-birthday-toggle${player.birthday_party_enabled?" active":""}`} type="button" aria-pressed={player.birthday_party_enabled} aria-label={`${player.birthday_party_enabled?"Desligar":"Ligar"} aviso de aniversário de ${player.display_name||player.username}`} onClick={()=>void updateBirthday(player,{birthday_party_enabled:!player.birthday_party_enabled})}><span><i />{player.birthday_party_enabled?"AVISO LIGADO":"AVISO DESLIGADO"}</span><strong>{player.birthday_party_enabled?"DESLIGAR AVISO":"LIGAR AVISO"}</strong></button></article>)}</div></section>}
      {selectedArea === "05-01" && <section className="control-commercial"><div className="control-editor-heading"><div><small>05.01 / COMERCIAL</small><h2>MEDIA KIT</h2><p>Edite a apresentação comercial mantendo a composição premium aprovada no site.</p></div><span>CONTEÚDO PÚBLICO</span></div><form onSubmit={handleCommercialSave}><fieldset><legend>CAPA DO MEDIA KIT</legend><label>IDENTIFICAÇÃO<input value={commercialContent.coverEyebrow} onChange={(event)=>setCommercialContent((item)=>({...item,coverEyebrow:event.target.value}))} /></label><label className="wide">TÍTULO<input value={commercialContent.coverTitle} onChange={(event)=>setCommercialContent((item)=>({...item,coverTitle:event.target.value}))} /></label><label className="wide">DESCRIÇÃO<textarea value={commercialContent.coverDescription} onChange={(event)=>setCommercialContent((item)=>({...item,coverDescription:event.target.value}))} /></label></fieldset><fieldset><legend>APRESENTAÇÃO & DIFERENCIAL</legend><label>TÍTULO SOBRE<input value={commercialContent.aboutTitle} onChange={(event)=>setCommercialContent((item)=>({...item,aboutTitle:event.target.value}))} /></label><label className="wide">SOBRE<textarea value={commercialContent.aboutText} onChange={(event)=>setCommercialContent((item)=>({...item,aboutText:event.target.value}))} /></label><label className="wide">TÍTULO DIFERENCIAL<input value={commercialContent.differenceTitle} onChange={(event)=>setCommercialContent((item)=>({...item,differenceTitle:event.target.value}))} /></label><label className="wide">TEXTO DIFERENCIAL<textarea value={commercialContent.differenceText} onChange={(event)=>setCommercialContent((item)=>({...item,differenceText:event.target.value}))} /></label></fieldset><div className="control-format-editor">{commercialContent.formats.map((format,index)=><fieldset key={index}><legend>FORMATO_{String(index+1).padStart(2,"0")}</legend><label>TÍTULO<input value={format.title} onChange={(event)=>setCommercialContent((item)=>({...item,formats:item.formats.map((current,i)=>i===index?{...current,title:event.target.value}:current)}))} /></label><label>DESCRIÇÃO<textarea value={format.description} onChange={(event)=>setCommercialContent((item)=>({...item,formats:item.formats.map((current,i)=>i===index?{...current,description:event.target.value}:current)}))} /></label></fieldset>)}</div><div className="control-editor-actions"><p>{commercialSaveState==="saved"?"CONTEÚDO DO MEDIA KIT PUBLICADO.":commercialSaveState==="error"?"ERRO AO PUBLICAR.":"ESTAS ALTERAÇÕES APARECEM NO MEDIA KIT."}</p><a href="/#parcerias" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit">SALVAR MEDIA KIT →</button></div></form></section>}
      {selectedArea === "05-03" && <section className="control-inbox"><div className="control-editor-heading"><div><small>05.03 / COMERCIAL</small><h2>CAIXA DE MENSAGENS</h2><p>Organize contatos recebidos pelo site e mantenha o histórico de atendimento.</p></div><span>{contactMessages.filter((item)=>item.status==="new").length} NOVAS</span></div><div className="control-inbox-list">{contactMessages.length===0?<div className="control-community-empty">NENHUMA MENSAGEM RECEBIDA.</div>:contactMessages.map((messageItem)=><article className={messageItem.status==="new"?"new":""} key={messageItem.id}><header><div><small>{messageItem.contact_type||"CONTATO"} · {new Date(messageItem.created_at).toLocaleString("pt-BR")}</small><h3>{messageItem.subject}</h3><b>{messageItem.sender_name} · {messageItem.sender_email}</b>{messageItem.company&&<span>{messageItem.company}</span>}</div><select value={messageItem.status} onChange={(event)=>void updateContactMessage(messageItem,{status:event.target.value as ContactMessage["status"]})}><option value="new">NOVA</option><option value="read">LIDA</option><option value="replied">RESPONDIDA</option><option value="archived">ARQUIVADA</option><option value="spam">SPAM</option></select></header><p>{messageItem.message}</p><label>NOTAS INTERNAS<textarea defaultValue={messageItem.admin_notes??""} onBlur={(event)=>void updateContactMessage(messageItem,{admin_notes:event.target.value})} /></label><a href={`mailto:${messageItem.sender_email}?subject=${encodeURIComponent(`Re: ${messageItem.subject}`)}`}>RESPONDER POR E-MAIL ↗</a></article>)}</div></section>}
      {selectedArea === "03-01" && <section className="control-bot"><div className="control-editor-heading"><div><small>03.01 / ARROBASRV</small><h2>CANAIS & COMANDOS</h2><p>Configure o comportamento compartilhado do bot. Tokens e segredos permanecem fora do navegador.</p></div><span>{botCommands.filter((item)=>item.enabled).length} COMANDOS ATIVOS</span></div><form onSubmit={saveBotCore}><div className="control-bot-channels">{botChannels.map((channel,index)=><article key={channel.platform}><header><b>{channel.platform}</b><span className={channel.connection_status}>{channel.connection_status.toUpperCase()}</span></header><label>CANAL<input value={channel.channel_name} onChange={(event)=>setBotChannels((items)=>items.map((item,i)=>i===index?{...item,channel_name:event.target.value}:item))} /></label><label className="control-check"><input type="checkbox" checked={channel.enabled} onChange={(event)=>setBotChannels((items)=>items.map((item,i)=>i===index?{...item,enabled:event.target.checked,connection_status:event.target.checked?"configured":"disconnected"}:item))} /> HABILITAR ADAPTADOR</label><small>CREDENCIAL SERÁ CONFIGURADA SOMENTE NO SERVIDOR.</small></article>)}</div><div className="control-command-toolbar"><label><span>⌕</span><input value={botCommandSearch} onChange={(event)=>setBotCommandSearch(event.target.value)} placeholder="PESQUISAR COMANDO" /></label><button type="button" onClick={()=>setShowBotVariables((value)=>!value)}>VARIÁVEIS ↗</button><button className="primary" type="button" onClick={()=>{const id=crypto.randomUUID();setBotCommands((items)=>[...items,{id,command:`!comando_${Date.now().toString().slice(-6)}`,description:"Novo comando personalizado.",response_template:"@{{user}}, configure esta resposta.",permission:"everyone",cooldown_seconds:10,enabled:true,sort_order:items.length+1}]);setOpenBotCommandId(id)}}>+ NOVO COMANDO</button></div>{showBotVariables&&<aside className="control-command-variables"><b>VARIÁVEIS DISPONÍVEIS</b><span>{"{{user}}"}</span><span>{"{{display_name}}"}</span><span>{"{{arguments}}"}</span><span>{"{{profile_url}}"}</span><span>{"{{rank}}"}</span><span>{"{{level}}"}</span><span>{"{{category}}"}</span><span>{"{{birthday_users}}"}</span></aside>}<div className="control-command-table-head"><span>STATUS</span><span>COMANDO</span><span>RESPOSTA</span><span>ESPERA</span><span>ACESSO</span><span /></div><div className="control-bot-commands">{botCommands.map((command,index)=>({command,index})).filter(({command})=>`${command.command} ${command.description} ${command.response_template}`.toLowerCase().includes(botCommandSearch.toLowerCase())).map(({command,index})=>{const isOpen=openBotCommandId===command.id;return <article className={`control-command-accordion${isOpen?" open":""}`} key={command.id}><div className="control-command-row"><label className="control-command-switch" title={command.enabled?"Desativar comando":"Ativar comando"}><input type="checkbox" checked={command.enabled} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,enabled:event.target.checked}:item))} /><span /></label><button className="control-command-summary" type="button" aria-expanded={isOpen} aria-controls={`command-${command.id}`} onClick={()=>setOpenBotCommandId(isOpen?null:command.id)}><b>{command.command}</b><em>{command.response_template}</em><small>{command.cooldown_seconds}S</small><strong>{command.permission.toUpperCase()}</strong><i>{isOpen?"−":"⌄"}</i></button></div>{isOpen&&<fieldset id={`command-${command.id}`}><label>COMANDO<input value={command.command} pattern="^![a-z0-9_]+$" onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,command:event.target.value.toLowerCase()}:item))} /></label><label>DESCRIÇÃO<input value={command.description} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,description:event.target.value}:item))} /></label><label className="wide">RESPOSTA / TEMPLATE<textarea value={command.response_template} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,response_template:event.target.value}:item))} /></label><label>PERMISSÃO<select value={command.permission} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,permission:event.target.value as BotCommand["permission"]}:item))}><option value="everyone">TODOS</option><option value="follower">FOLLOWERS</option><option value="subscriber">SUBS</option><option value="moderator">MODERADORES</option><option value="broadcaster">THENEES</option></select></label><label>COOLDOWN / SEG<input type="number" min="0" value={command.cooldown_seconds} onChange={(event)=>setBotCommands((items)=>items.map((item,i)=>i===index?{...item,cooldown_seconds:Number(event.target.value)}:item))} /></label></fieldset>}</article>})}</div><div className="control-editor-actions"><p>{botSaveState==="saved"?"CONFIGURAÇÃO DO ARROBASRV SALVA.":botSaveState==="error"?"ERRO AO SALVAR O ARROBASRV.":"A CONEXÃO REAL SERÁ FEITA NOS ADAPTADORES TWITCH E KICK."}</p><button type="submit">SALVAR ARROBASRV →</button></div></form></section>}
      {selectedArea === "03-03" && <section className="control-bot"><div className="control-editor-heading"><div><small>03.03 / ARROBASRV</small><h2>AUTOMAÇÕES & FILA</h2><p>Ative os eventos pela lista e abra somente a automação que deseja editar.</p></div><span>{botOutbox.filter((item)=>item.status==="pending").length} NA FILA</span></div><form onSubmit={saveBotCore}><div className="control-automation-table-head"><span>STATUS</span><span>EVENTO</span><span>MENSAGEM</span><span>DESTINO</span><span>LINK</span><span /></div><div className="control-automation-list">{botAutomations.map((automation,index)=>{const isOpen=openBotAutomationKey===automation.event_key;return <article className={`control-automation-accordion${isOpen?" open":""}`} key={automation.event_key}><div className="control-automation-row"><label className="control-command-switch" title={automation.enabled?"Desativar automação":"Ativar automação"}><input type="checkbox" checked={automation.enabled} onChange={(event)=>void updateAutomationOption(automation,"enabled",event.target.checked)} /><span /></label><button className="control-automation-summary" type="button" aria-expanded={isOpen} aria-controls={`automation-${automation.event_key}`} onClick={()=>setOpenBotAutomationKey(isOpen?null:automation.event_key)}><b>{automation.label}</b><em>{automation.message_template}</em><strong>{automation.target_platform}</strong><small>{automation.include_site_link?"SIM":"NÃO"}</small><i>{isOpen?"−":"⌄"}</i></button></div>{isOpen&&<fieldset id={`automation-${automation.event_key}`}><label>RÓTULO<input value={automation.label} onChange={(event)=>setBotAutomations((items)=>items.map((item,i)=>i===index?{...item,label:event.target.value}:item))} /></label><label>DESTINO<select value={automation.target_platform} onChange={(event)=>setBotAutomations((items)=>items.map((item,i)=>i===index?{...item,target_platform:event.target.value as BotAutomation["target_platform"]}:item))}><option>BOTH</option><option>TWITCH</option><option>KICK</option></select></label><label className="wide">MENSAGEM / TEMPLATE<textarea value={automation.message_template} onChange={(event)=>setBotAutomations((items)=>items.map((item,i)=>i===index?{...item,message_template:event.target.value}:item))} /></label><label className="control-check"><input type="checkbox" checked={automation.include_site_link} onChange={(event)=>void updateAutomationOption(automation,"include_site_link",event.target.checked)} /> INCLUIR LINK DO SITE</label></fieldset>}</article>})}</div><div className="control-editor-actions"><p>{botSaveState==="saved"?"AUTOMAÇÕES SALVAS.":botSaveState==="error"?"ERRO AO PROCESSAR.":"O STATUS É SALVO IMEDIATAMENTE. ABRA UMA LINHA PARA EDITAR A MENSAGEM."}</p><button type="button" onClick={()=>void queueBirthdays()}>ENFILEIRAR ANIVERSÁRIOS DE HOJE</button><button type="submit">SALVAR AUTOMAÇÕES →</button></div></form><section className="control-bot-outbox"><header><b>FILA DE ENTREGA</b><span>ÚLTIMOS 30 EVENTOS</span></header>{botOutbox.length===0?<div className="control-community-empty">NENHUM EVENTO NA FILA.</div>:botOutbox.map((item)=><article key={item.id}><span><b>{item.event_key}</b><small>{item.target_platform} · {new Date(item.created_at).toLocaleString("pt-BR")}</small></span><strong className={item.status}>{item.status.toUpperCase()}</strong><em>{item.attempts} TENTATIVAS</em>{item.status==="failed"&&<button type="button" onClick={()=>void retryBotItem(item)}>REPROCESSAR</button>}</article>)}</section></section>}
      {selectedArea === "06-02" && <section className="control-integrations"><div className="control-editor-heading"><div><small>06.02 / ADMINISTRAÇÃO</small><h2>INTEGRAÇÕES</h2><p>Conecte as plataformas por OAuth. Tokens permanecem no ambiente privado das funções e nunca são enviados ao navegador.</p></div><span>OAUTH / EVENTSUB</span></div>{integrationMessage&&<div className="control-team-message">{integrationMessage}</div>}<div className="control-integration-grid">{platformIntegrations.map((integration)=><article key={integration.platform}><header><div><small>PLATAFORMA</small><h3>{integration.platform}</h3></div><span className={integration.status}>{integration.status.toUpperCase()}</span></header><dl><div><dt>CANAL</dt><dd>{integration.channel_login||"thenees"}</dd></div><div><dt>CONTA</dt><dd>{integration.display_name||"AGUARDANDO AUTORIZAÇÃO"}</dd></div><div><dt>EVENTOS</dt><dd>{integration.eventsub_status.toUpperCase()}</dd></div><div><dt>ÚLTIMA SINCRONIA</dt><dd>{integration.last_synced_at?new Date(integration.last_synced_at).toLocaleString("pt-BR"):"--"}</dd></div></dl>{integration.scopes.length>0&&<div className="control-integration-scopes">{integration.scopes.map((scope)=><span key={scope}>{scope}</span>)}</div>}{integration.last_error&&<p>{integration.last_error}</p>}<footer>{integration.platform==="TWITCH"&&integration.status!=="connected"&&<button type="button" onClick={()=>void connectTwitch()}>CONECTAR TWITCH →</button>}{integration.platform==="TWITCH"&&integration.status==="connected"&&<><button type="button" onClick={()=>void subscribeTwitch()}>ATIVAR EVENTSUB</button><button type="button" onClick={()=>void testTwitchWorker()}>TESTAR FILA</button><button type="button" onClick={()=>void connectTwitch()}>REAUTORIZAR TWITCH</button></>} {integration.status==="connected"&&<button className="danger" type="button" onClick={()=>void disconnectIntegration(integration.platform)}>DESCONECTAR</button>}{integration.platform==="KICK"&&integration.status!=="connected"&&<button type="button" disabled>ETAPA 08 / EM BREVE</button>}</footer></article>)}</div><aside className="control-integration-note"><b>SEGREDOS NECESSÁRIOS NO SUPABASE</b><p>TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_REDIRECT_URI, TWITCH_EVENTSUB_CALLBACK, TWITCH_EVENTSUB_SECRET e BOT_WORKER_SECRET.</p><span>NENHUM DESSES VALORES SERÁ EXIBIDO NESTA TELA.</span></aside></section>}
      {selectedArea === "03-04" && <section className="control-shortener"><div className="control-editor-heading"><div><small>03.04 / ARROBASRV</small><h2>ENCURTADOR DE LINKS</h2><p>Crie endereços curtos e fáceis de usar no chat, comandos e campanhas da comunidade.</p></div><span>{shortLinks.filter((item)=>item.active).length} LINKS ATIVOS</span></div><form className="control-shortener-form" onSubmit={createShortLink} noValidate><label>NOME DO LINK<input value={shortLinkDraft.label} onChange={(event)=>setShortLinkDraft((item)=>({...item,label:event.target.value}))} placeholder="SERVIDOR DO DISCORD" /></label><label>APELIDO / SLUG<div className="control-slug-input"><span>/go/</span><input value={shortLinkDraft.slug} onChange={(event)=>setShortLinkDraft((item)=>({...item,slug:event.target.value}))} placeholder="discord" /></div></label><label className="wide">LINK DE DESTINO<input type="text" inputMode="url" value={shortLinkDraft.destinationUrl} onChange={(event)=>setShortLinkDraft((item)=>({...item,destinationUrl:event.target.value}))} placeholder="https://..." /></label><button type="submit" disabled={shortLinkState==="saving"}>{shortLinkState==="saving"?"CRIANDO...":"CRIAR LINK CURTO →"}</button></form><div className={`control-shortener-feedback ${shortLinkState}`}>{shortLinkState==="saved"?"LINKS SINCRONIZADOS.":shortLinkState==="error"?"NÃO FOI POSSÍVEL SALVAR. CONFIRA SE O APELIDO É ÚNICO E O DESTINO É VÁLIDO.":"OS LINKS FICAM DISPONÍVEIS IMEDIATAMENTE PARA O ARROBASRV."}</div><div className="control-shortener-list">{shortLinks.length===0?<div className="control-community-empty">NENHUM LINK CURTO CRIADO.</div>:shortLinks.map((item)=><article className={item.active?"active":""} key={item.id}><div><small>{item.label}</small><b>WWW.THENEES.COM.BR/GO/{item.slug.toUpperCase()}</b><a href={item.destinationUrl} target="_blank" rel="noreferrer">{item.destinationUrl}</a></div><span>{item.active?"ATIVO":"DESLIGADO"}</span><button type="button" onClick={()=>void navigator.clipboard.writeText(`https://www.thenees.com.br/go/${item.slug}`)}>COPIAR</button><button type="button" onClick={()=>void persistShortLinks(shortLinks.map((current)=>current.id===item.id?{...current,active:!current.active}:current))}>{item.active?"DESATIVAR":"ATIVAR"}</button><button className="danger" type="button" onClick={()=>void persistShortLinks(shortLinks.filter((current)=>current.id!==item.id))}>EXCLUIR</button></article>)}</div></section>}
      {selectedArea === "05-02" && <section className="control-partner-brands"><div className="control-editor-heading"><div><small>05.02 / PARCERIAS</small><h2>MARCAS & APOIADORES</h2><p>Defina os espaços agora. Quando os arquivos oficiais chegarem, cada nome poderá ser substituído pelo respectivo logo.</p></div><span>{commercialContent.partners.filter((partner)=>partner.active).length} VISÍVEIS</span></div><form onSubmit={handleCommercialSave}><div className="control-partner-brand-list">{commercialContent.partners.map((partner,index)=><article key={`${partner.name}-${index}`}><span>{String(index+1).padStart(2,"0")}</span><label>NOME DA MARCA<input value={partner.name} onChange={(event)=>setCommercialContent((item)=>({...item,partners:item.partners.map((current,i)=>i===index?{...current,name:event.target.value}:current)}))} /></label><label>ARQUIVO DO LOGO <small>OPCIONAL / PARA A PRÓXIMA FASE</small><input type="url" value={partner.logo_url} onChange={(event)=>setCommercialContent((item)=>({...item,partners:item.partners.map((current,i)=>i===index?{...current,logo_url:event.target.value}:current)}))} placeholder="https://..." /></label><button className={partner.active?"active":""} type="button" onClick={()=>setCommercialContent((item)=>({...item,partners:item.partners.map((current,i)=>i===index?{...current,active:!current.active}:current)}))}>{partner.active?"VISÍVEL":"OCULTA"}</button><button className="danger" type="button" onClick={()=>setCommercialContent((item)=>({...item,partners:item.partners.filter((_,i)=>i!==index)}))}>REMOVER</button></article>)}</div><button className="control-add-partner" type="button" onClick={()=>setCommercialContent((item)=>({...item,partners:[...item.partners,{name:`PARCEIRO ${String(item.partners.length+1).padStart(2,"0")}`,logo_url:"",active:true}]}))}>+ ADICIONAR ESPAÇO</button><div className="control-editor-actions"><p>{commercialSaveState==="saved"?"MARCAS PUBLICADAS NA LANDING.":commercialSaveState==="error"?"ERRO AO PUBLICAR MARCAS.":"OS NOMES APARECEM ABAIXO DOS FORMATOS DE PARCERIA."}</p><a href="/#parcerias" target="_blank" rel="noreferrer">PRÉ-VISUALIZAR ↗</a><button type="submit">SALVAR MARCAS →</button></div></form></section>}
    </section>
  </main>;
}
