"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const sections = ["sobre", "live", "game", "comunidade", "parcerias", "lab"];

// Future Twitch/Kick integration only needs to update this status object.
// Until a real platform confirms the broadcast, the truthful state is offline.
const liveStatus: { isLive: boolean; platform: "TWITCH" | "KICK" | null; url: string | null } = {
  isLive: false,
  platform: null,
  url: null,
};

// This label will come from the game settings in Thenees Control.
const gameSettings = { name: "ChatBattle" };
const defaultOfficialLinks = {
  communityUrl: "https://www.theneees.com.br/#comunidade",
  discordUrl: "https://discord.gg/fUEG3h2ED",
  twitchUrl: "https://www.twitch.tv/thenees",
  kickUrl: "https://kick.com/thenees",
  email: "contato@theneees.com.br",
  youtubeUrl: "https://www.youtube.com/@theneesr",
  channels: [{platform:"TWITCH",url:"https://www.twitch.tv/thenees"},{platform:"KICK",url:"https://kick.com/thenees"},{platform:"YOUTUBE",url:"https://www.youtube.com/@theneesr"},{platform:"DISCORD",url:"https://discord.gg/fUEG3h2ED"}],
};
const defaultSiteContent = { aboutText:"Thenees transforma live em playground. Aqui a comunidade não fica só olhando — ela vota, interfere, compete e, ocasionalmente, destrói qualquer chance de vitória.",gameText:"Um game persistente que nasce dentro do chat da live. Cada pessoa cria seu personagem, participa usando comandos e, quando a transmissão termina, continua a jornada em sua própria área de perfil.",communityText:"Uma comunidade construída para participar, criar memória e transformar cada transmissão em uma experiência coletiva.",partnersText:"Projetos criativos, conteúdo autêntico e uma comunidade que realmente participa. Vamos criar algo que as pessoas queiram assistir — e lembrar.",labText:"Bots, ferramentas para o chat, encurtador de links, integrações e ideias perigosamente próximas de virar produto.",footerTagline:"Streamer, criador e responsável por transformar interação em experiência.",footerBusinessText:"Parcerias, projetos, eventos e ideias perigosamente próximas de funcionar." };

type HeroContent = {
  eyebrow: string; version: string; titleLine1: string; titleLine2Lead: string; titleLine2Accent: string;
  titleLine3: string; subtitle: string; description: string; primaryLabel: string; primaryHref: string;
  secondaryLabel: string; secondaryHref: string;
};
type ProfileItem = { item_key: string; label: string; value: string; helper_text: string; link_url: string | null; sort_order: number };
type PublicScheduleEvent = { id:string; starts_at:string; title:string; game:string|null; platform:string; description:string|null };
type PublicFeaturedVideo = { title:string; video_url:string; thumbnail_url:string|null };
type PublicCommunityMetric = { metric_key:string;label:string;value:string;helper_text:string|null;source:string };
type PublicCommunityQuote = { id:string;quote_text:string;author_name:string;platform:string;quoted_at:string };
type PublicCommercialContent = { coverEyebrow:string;coverTitle:string;coverDescription:string;aboutTitle:string;aboutText:string;differenceTitle:string;differenceText:string;formats:{title:string;description:string}[];partners:{name:string;logo_url:string;active:boolean}[] };
type SantosWeather = { temperature:number|null;label:string;icon:"sun"|"night"|"cloud"|"rain"|"storm"|"fog" };
const defaultCommercialContent: PublicCommercialContent = {coverEyebrow:"STREAMER · DIRETOR DE ARTE · CREATOR",coverTitle:"MARCAS ENTRAM. A COMUNIDADE JOGA.",coverDescription:"Conteúdo, live e experiências interativas construídas para serem vividas — não apenas assistidas.",aboutTitle:"THENEES",aboutText:"Streamer, Diretor de Arte e criador do ChatBattle. Transformo participação do chat em conteúdo, narrativa e experiências que aproximam pessoas e marcas.",differenceTitle:"O CHAT NÃO ASSISTE. ELE DECIDE.",differenceText:"No ChatBattle, a marca pode fazer parte da mecânica: ativar eventos, liberar missões coletivas e recompensar toda a comunidade sem comprar a vitória individual.",formats:[{title:"LIVE PATROCINADA",description:"Produto, desafio e narrativa integrados à transmissão."},{title:"BRANDED GAME",description:"Missões, criaturas e recompensas de marca no ChatBattle."},{title:"CONTEÚDO",description:"YouTube, cortes, redes sociais e campanhas com direção criativa."},{title:"EVENTOS",description:"Presença, cobertura e experiências participativas para a comunidade."}],partners:[{name:"NVIDIA",logo_url:"",active:true},{name:"AMD",logo_url:"",active:true},{name:"SAMSUNG",logo_url:"",active:true},{name:"FIFINE",logo_url:"",active:true},{name:"PARCEIRO 05",logo_url:"",active:true},{name:"SUA MARCA AQUI",logo_url:"",active:true}]};

const defaultHeroContent: HeroContent = {
  eyebrow: "SISTEMA OPERACIONAL DA COMUNIDADE", version: "V.01 / 2026", titleLine1: "EU JOGO.",
  titleLine2Lead: "VOCÊS", titleLine2Accent: "INTERAGEM.", titleLine3: "FUNCIONA.",
  subtitle: "Twitch + Kick + Games + Comunidade", description: "Um lugar onde assistir à live é só o começo.",
  primaryLabel: "ASSISTIR AO VIVO", primaryHref: "#live", secondaryLabel: "CONHECER O GAME", secondaryHref: "#game",
};

const describeSantosWeather = (code:number,isDay:boolean):Pick<SantosWeather,"label"|"icon"> => {
  if(code===0)return {label:isDay?"CÉU LIMPO":"NOITE LIMPA",icon:isDay?"sun":"night"};
  if([1,2,3].includes(code))return {label:code===3?"NUBLADO":"PARCIALMENTE NUBLADO",icon:"cloud"};
  if([45,48].includes(code))return {label:"NEBLINA",icon:"fog"};
  if(code>=95)return {label:"TEMPESTADE",icon:"storm"};
  if((code>=51&&code<=82)||(code>=85&&code<=86))return {label:"CHUVA",icon:"rain"};
  return {label:"TEMPO VARIÁVEL",icon:"cloud"};
};

const defaultProfileItems: ProfileItem[] = [
  { item_key:"music",label:"MÚSICA PREFERIDA",value:"WITHOUT YOU",helper_text:"AVICII / SPOTIFY ↗",link_url:"https://open.spotify.com/intl-pt/track/6Pgkp4qUoTmJIPn7ReaGxL?si=18d6bc45a881405f",sort_order:1 },
  { item_key:"food",label:"COMIDA",value:"STROGONOFF DE FRANGO",helper_text:"BUFF DE ENERGIA FAVORITO",link_url:null,sort_order:2 },
  { item_key:"place",label:"LUGAR",value:"JAPÃO",helper_text:"PONTO DE SPAWN IDEAL",link_url:null,sort_order:3 },
  { item_key:"dream",label:"SONHO",value:"CONHECER O JAPÃO",helper_text:"MISSÃO PRINCIPAL",link_url:null,sort_order:4 },
  { item_key:"work",label:"O QUE EU FAÇO",value:"DIRETOR DE ARTE / STREAMER",helper_text:"CLASSE PROFISSIONAL",link_url:null,sort_order:5 },
  { item_key:"game",label:"JOGO FAVORITO",value:"ROCK N’ ROLL RACING",helper_text:"MEGA DRIVE / RESPONSÁVEL POR BOA PARTE DA PERSONALIDADE",link_url:null,sort_order:6 },
  { item_key:"skill",label:"SKILL PRINCIPAL",value:"DEITAR SEM SONO",helper_text:"HABILIDADE REALMENTE ÚTIL",link_url:null,sort_order:7 },
  { item_key:"project",label:"PROJETO ATUAL",value:"SER UM STREAMER MELHOR",helper_text:"QUEST ATIVA",link_url:null,sort_order:8 },
  { item_key:"fuel",label:"COMBUSTÍVEL CRIATIVO",value:"CONTATO HUMANO",helper_text:"RECURSO CONSUMIDO EM QUANTIDADES DUVIDOSAS",link_url:null,sort_order:9 },
  { item_key:"hobby",label:"HOBBY FORA DA TELA",value:"MTB",helper_text:"MODO OFFLINE",link_url:null,sort_order:10 },
  { item_key:"defect",label:"DEFEITO DE FÁBRICA",value:"DURMO POUCO",helper_text:"BUG CONHECIDO, PATCH NÃO PREVISTO",link_url:null,sort_order:11 },
  { item_key:"rule",label:"REGRA PESSOAL",value:"NÃO DESISTIR ATÉ CONSEGUIR",helper_text:"CÓDIGO-FONTE MORAL",link_url:null,sort_order:12 },
];

// Preview of incentive records managed by Thenees Control. Labels, titles and
// descriptions will be editable without changing the public site component.
const adminLiveEventEffectsPreview = {
  follow: { label: "FOLLOW", title: "NOVO ALIADO", effect: "Recarrega uma parte da energia coletiva e adiciona recursos ao inventário compartilhado da comunidade." },
  sub: { label: "SUB", title: "BUFF DE GRUPO", effect: "Ativa um bônus temporário para todos e pode liberar uma missão especial durante a transmissão." },
  bits: { label: "BITS", title: "MEDIDOR DE CAOS", effect: "Alimenta o medidor coletivo. Ao atingir certos marcos, o cenário muda e um evento surpresa começa para todo mundo." },
  donate: { label: "DONATE", title: "EVENTO GLOBAL", effect: "Invoca desafios, modificadores ou chefes especiais. A recompensa conquistada é distribuída para a comunidade inteira." },
} as const;

const chatBattleSequence = [
  { type: "bot", name: "NeesBot", text: "Uma criatura bloqueou o caminho. Comunidade, escolham uma ação!" },
  { type: "user", name: "gabi.exe", text: "!atacar" },
  { type: "user", name: "luquinhas_77", text: "!defender" },
  { type: "bot", name: "NeesBot", text: "Comandos registrados: ataque coletivo + escudo de grupo." },
  { type: "event", name: "FOLLOW", text: "mari_player entrou na comunidade. Energia coletiva +8%." },
  { type: "event", name: "BITS", text: "pixelmago enviou 250 bits. Medidor de caos em 72%." },
  { type: "event", name: "SUB", text: "nina_zero virou sub. Buff de grupo desbloqueado: DOBRO DE CORAGEM." },
  { type: "event", name: "DONATE", text: "rafa.exe ativou um evento global: CHEFE SURPRESA." },
  { type: "bot", name: "NeesBot", text: "NOVO PLAYER: @byte_mari entrou no ChatBattle. Categoria: GUARDIÃ. Boas-vindas à comunidade!" },
  { type: "event", name: "ANIVERSÁRIO", text: "Hoje é aniversário de @pixelmago! Comunidade, enviem parabéns e muitos buffs no chat!" },
  { type: "bot", name: "NeesBot", text: "Golpe coletivo: 418 de dano. Recompensa compartilhada com toda a comunidade." },
] as const;

// Preview of approved quotes. In production these records are created by the
// bot only when !quote is used by the broadcaster or an authorized moderator.
const adminQuotesPreview = [
  { text: "Eu vim pela gameplay. Fiquei pelo desastre.", author: "gabi.exe", date: "09/08/2026", platform: "TWITCH" },
  { text: "Tecnicamente não perdemos. Só paramos de ganhar.", author: "pixelmago", date: "02/08/2026", platform: "KICK" },
  { text: "O plano funcionou até a parte em que começou.", author: "luquinhas_77", date: "27/07/2026", platform: "TWITCH" },
] as const;

type AsciiParticle = { x: number; y: number; char: string; alpha: number; seed: number };
type BrazilDate = { year: number; month: number; day: number; weekDay: number };

function getBrazilDate(date: Date): BrazilDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  return { year, month, day, weekDay: new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() };
}

const formatBrazilDay = (date: BrazilDate) => `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}`;
const getYouTubeId = (url:string) => url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/)?.[1] ?? "";
const formatScheduleDate = (iso:string) => {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("pt-BR",{ timeZone:"America/Sao_Paulo",weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false }).formatToParts(date);
  const value = (type:Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { day:value("weekday").replace(".","").toUpperCase(),date:`${value("day")}/${value("month")}`,hour:`${value("hour")}:${value("minute")}` };
};

export default function Home() {
  const [heroContent, setHeroContent] = useState<HeroContent>(defaultHeroContent);
  const [profileItems, setProfileItems] = useState<ProfileItem[]>(defaultProfileItems);
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState("--:--:--");
  const [santosWeather, setSantosWeather] = useState<SantosWeather>({temperature:null,label:"CARREGANDO CLIMA",icon:"cloud"});
  const [brazilToday, setBrazilToday] = useState<BrazilDate | null>(null);
  const [registeredPlayerBirthday,setRegisteredPlayerBirthday] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<"live" | "profile">("live");
  const [selectedLiveEvent, setSelectedLiveEvent] = useState<keyof typeof adminLiveEventEffectsPreview>("follow");
  const [chatStep, setChatStep] = useState(1);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [videoActive, setVideoActive] = useState(false);
  const [videoLinkCopied, setVideoLinkCopied] = useState(false);
  const [scheduleEvents, setScheduleEvents] = useState<PublicScheduleEvent[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<PublicFeaturedVideo>({ title:"Melhores Momentos das Lives! #01",video_url:"https://www.youtube.com/watch?v=eiEJdsE7pNI",thumbnail_url:"https://i.ytimg.com/vi/eiEJdsE7pNI/maxresdefault.jpg" });
  const [siteContent, setSiteContent] = useState(defaultSiteContent);
  const [officialLinks, setOfficialLinks] = useState(defaultOfficialLinks);
  const [communityMetrics, setCommunityMetrics] = useState<PublicCommunityMetric[]>([
    {metric_key:"followers",label:"SEGUIDORES",value:"04.2K",helper_text:"TWITCH + KICK",source:"MANUAL"},
    {metric_key:"active_subs",label:"SUBS ATIVOS",value:"0328",helper_text:"DADOS AUTORIZADOS",source:"MANUAL"},
    {metric_key:"watch_hours",label:"HORAS ASSISTIDAS",value:"18.6K",helper_text:"CALCULADAS PELO SISTEMA",source:"MANUAL"},
    {metric_key:"chaos_clips",label:"CLIPES DO CAOS",value:"01.3K",helper_text:"PROVAS DOCUMENTAIS",source:"MANUAL"},
  ]);
  const [communityQuotes, setCommunityQuotes] = useState<PublicCommunityQuote[]>(adminQuotesPreview.map((quote,index)=>({id:String(index),quote_text:quote.text,author_name:quote.author,platform:quote.platform,quoted_at:quote.date.split("/").reverse().join("-")})));
  const [contactOpen, setContactOpen] = useState(false);
  const [mediaKitOpen, setMediaKitOpen] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "invalid" | "sending" | "validated" | "error">("idle");
  const [commercialContent, setCommercialContent] = useState<PublicCommercialContent>(defaultCommercialContent);
  const [heroScroll, setHeroScroll] = useState(0);
  const [activeSection, setActiveSection] = useState("home");
  const portraitRef = useRef<HTMLElement | null>(null);
  const asciiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" }));
      setBrazilToday(getBrazilDate(now));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller=new AbortController();
    const loadWeather=async()=>{
      try{
        const response=await fetch("https://api.open-meteo.com/v1/forecast?latitude=-23.9608&longitude=-46.3336&current=temperature_2m,weather_code,is_day&timezone=America%2FSao_Paulo",{signal:controller.signal});
        if(!response.ok)throw new Error("weather_unavailable");
        const payload=await response.json() as {current?:{temperature_2m?:number;weather_code?:number;is_day?:number}};
        const current=payload.current;
        if(!current||typeof current.temperature_2m!=="number"||typeof current.weather_code!=="number")throw new Error("weather_invalid");
        setSantosWeather({temperature:Math.round(current.temperature_2m),...describeSantosWeather(current.weather_code,current.is_day===1)});
      }catch{if(!controller.signal.aborted)setSantosWeather({temperature:null,label:"CLIMA INDISPONÍVEL",icon:"cloud"});}
    };
    void loadWeather();
    const timer=window.setInterval(()=>void loadWeather(),15*60*1000);
    return()=>{controller.abort();window.clearInterval(timer)};
  },[]);

  useEffect(()=>{
    if(!isSupabaseConfigured)return;
    const supabase=getSupabaseBrowserClient();
    const loadPlayerBirthday=async(userId:string|null)=>{
      if(!userId){setRegisteredPlayerBirthday(null);return;}
      const {data}=await supabase.from("game_players").select("birthday,birthday_public,birthday_party_enabled").eq("auth_user_id",userId).maybeSingle();
      if(!data?.birthday||!data.birthday_public||!data.birthday_party_enabled){setRegisteredPlayerBirthday(null);return;}
      const [,month,day]=data.birthday.split("-");
      setRegisteredPlayerBirthday(month&&day?`${day}/${month}`:null);
    };
    void supabase.auth.getUser().then(({data})=>void loadPlayerBirthday(data.user?.id??null));
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>void loadPlayerBirthday(session?.user.id??null));
    return()=>listener.subscription.unsubscribe();
  },[]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void getSupabaseBrowserClient().from("profile_items").select("item_key,label,value,helper_text,link_url,sort_order").eq("active", true).order("sort_order").then(({ data }) => {
      if (data?.length) setProfileItems(data.map((item) => ({ ...item, helper_text: item.helper_text ?? "" })) as ProfileItem[]);
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase=getSupabaseBrowserClient();
    const refreshCommercial=()=>supabase.from("site_settings").select("value").eq("key","commercial_content").maybeSingle().then(({data})=>{
      if(data?.value && typeof data.value === "object")setCommercialContent({...defaultCommercialContent,...data.value as Partial<PublicCommercialContent>});
    });
    void refreshCommercial();
    const channel=supabase.channel("thenees-landing-commercial").on("postgres_changes",{event:"*",schema:"public",table:"site_settings",filter:"key=eq.commercial_content"},()=>void refreshCommercial()).subscribe();
    const refreshFromStorage=(event:StorageEvent)=>{if(event.key==="thenees-commercial-content-updated")void refreshCommercial()};
    const signal="BroadcastChannel" in window?new BroadcastChannel("thenees-commercial-content"):null;
    if(signal)signal.onmessage=()=>void refreshCommercial();
    window.addEventListener("storage",refreshFromStorage);
    return()=>{window.removeEventListener("storage",refreshFromStorage);signal?.close();void supabase.removeChannel(channel)};
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const refreshSiteSettings=()=>getSupabaseBrowserClient().from("site_settings").select("key,value").in("key",["site_content","official_links"]).then(({ data }) => {
      for (const item of data ?? []) {
        if (item.key === "site_content" && item.value && typeof item.value === "object") setSiteContent({ ...defaultSiteContent,...item.value as Partial<typeof defaultSiteContent> });
        if (item.key === "official_links" && item.value && typeof item.value === "object") {
          const links = item.value as Record<string,unknown>;
          const channels=Array.isArray(links.channels)?links.channels.filter((channel):channel is {platform:string;url:string}=>Boolean(channel&&typeof channel==="object"&&"platform" in channel&&"url" in channel)):defaultOfficialLinks.channels;
          setOfficialLinks({ ...defaultOfficialLinks,twitchUrl:String(links.twitch ?? links.twitchUrl ?? defaultOfficialLinks.twitchUrl),kickUrl:String(links.kick ?? links.kickUrl ?? defaultOfficialLinks.kickUrl),youtubeUrl:String(links.youtube ?? links.youtubeUrl ?? defaultOfficialLinks.youtubeUrl),discordUrl:String(links.discord ?? links.discordUrl ?? defaultOfficialLinks.discordUrl),email:String(links.email ?? defaultOfficialLinks.email),communityUrl:String(links.community ?? links.communityUrl ?? defaultOfficialLinks.communityUrl),channels });
        }
      }
    });
    void refreshSiteSettings();
    const refreshFromStorage=(event:StorageEvent)=>{if(event.key==="thenees-official-links-updated")void refreshSiteSettings()};
    const signal="BroadcastChannel" in window?new BroadcastChannel("thenees-official-links"):null;
    if(signal)signal.onmessage=()=>void refreshSiteSettings();
    window.addEventListener("storage",refreshFromStorage);
    return()=>{window.removeEventListener("storage",refreshFromStorage);signal?.close()};
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    const refreshLiveContent=async()=>{
      const [schedule,video]=await Promise.all([
        supabase.from("schedule_events").select("id,starts_at,title,game,platform,description").eq("published",true).gte("starts_at",new Date(Date.now()-21600000).toISOString()).order("starts_at").limit(4),
        supabase.from("featured_videos").select("title,video_url,thumbnail_url").eq("published",true).order("sort_order").limit(1).maybeSingle(),
      ]);
      if (schedule.data?.length) setScheduleEvents(schedule.data as PublicScheduleEvent[]);
      else setScheduleEvents([]);
      if (video.data) setFeaturedVideo(video.data as PublicFeaturedVideo);
    };
    void refreshLiveContent();
    const channel=supabase.channel("thenees-landing-live-content")
      .on("postgres_changes",{event:"*",schema:"public",table:"schedule_events"},()=>void refreshLiveContent())
      .on("postgres_changes",{event:"*",schema:"public",table:"featured_videos"},()=>void refreshLiveContent())
      .subscribe();
    const timer=window.setInterval(()=>void refreshLiveContent(),30000);
    const refreshWhenVisible=()=>{if(document.visibilityState==="visible")void refreshLiveContent()};
    const refreshFromStorage=(event:StorageEvent)=>{if(event.key==="thenees-live-content-updated")void refreshLiveContent()};
    const liveSignal="BroadcastChannel" in window?new BroadcastChannel("thenees-live-content"):null;
    if(liveSignal)liveSignal.onmessage=()=>void refreshLiveContent();
    document.addEventListener("visibilitychange",refreshWhenVisible);
    window.addEventListener("storage",refreshFromStorage);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refreshWhenVisible);window.removeEventListener("storage",refreshFromStorage);liveSignal?.close();void supabase.removeChannel(channel)};
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    const refreshCommunity = async () => {
      const [metrics,quotes] = await Promise.all([
        supabase.from("community_metrics").select("metric_key,label,value,helper_text,source").eq("is_public",true),
        supabase.from("community_quotes").select("id,quote_text,author_name,platform,quoted_at").eq("approved",true).order("quoted_at",{ascending:false}).limit(12),
      ]);
      setCommunityMetrics((metrics.data??[]) as PublicCommunityMetric[]);
      setCommunityQuotes((quotes.data??[]) as PublicCommunityQuote[]);setQuoteIndex(0);
    };
    void refreshCommunity();
    const channel=supabase.channel("thenees-landing-quotes")
      .on("postgres_changes",{event:"*",schema:"public",table:"community_quotes"},()=>void refreshCommunity())
      .on("postgres_changes",{event:"*",schema:"public",table:"community_metrics"},()=>void refreshCommunity())
      .subscribe();
    const timer=window.setInterval(()=>void refreshCommunity(),30000);
    const refreshWhenVisible=()=>{if(document.visibilityState==="visible")void refreshCommunity()};
    const refreshFromStorage=(event:StorageEvent)=>{if(event.key==="thenees-community-content-updated")void refreshCommunity()};
    const communitySignal="BroadcastChannel" in window?new BroadcastChannel("thenees-community-content"):null;
    if(communitySignal)communitySignal.onmessage=()=>void refreshCommunity();
    document.addEventListener("visibilitychange",refreshWhenVisible);
    window.addEventListener("storage",refreshFromStorage);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refreshWhenVisible);window.removeEventListener("storage",refreshFromStorage);communitySignal?.close();void supabase.removeChannel(channel)};
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void getSupabaseBrowserClient().from("site_settings").select("value").eq("key", "hero_content").maybeSingle().then(({ data }) => {
      if (data?.value && typeof data.value === "object") setHeroContent({ ...defaultHeroContent, ...(data.value as Partial<HeroContent>) });
    });
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setQuoteIndex((current) => (current + 1) % Math.max(communityQuotes.length,1)), 5200);
    return () => window.clearInterval(timer);
  }, [communityQuotes.length]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setChatStep(chatBattleSequence.length);
      return;
    }
    const timer = window.setInterval(() => {
      setChatStep((current) => current >= chatBattleSequence.length + 2 ? 1 : current + 1);
    }, 1650);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const container = portraitRef.current;
    const canvas = asciiCanvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d", { desynchronized: true });
    if (!context) return;

    const source = new Image();
    source.src = "/thenees-ascii-source.jpg";
    const offscreen = document.createElement("canvas");
    const sampleContext = offscreen.getContext("2d", { willReadFrequently: true });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const symbols = " .,:;i1tfLCG08@";
    let particles: AsciiParticle[] = [];
    let cell = 8;
    let frame = 0;
    let idleTimer = 0;
    let hovering = false;
    let visible = true;
    let lastPaint = 0;
    let pointerX = -999;
    let pointerY = -999;

    const draw = (time = 0) => {
      const rect = container.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      context.font = `${Math.max(7, cell * 1.04)}px "Silkscreen", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (const particle of particles) {
        let x = particle.x;
        let y = particle.y;
        const dx = x - pointerX;
        const dy = y - pointerY;
        const distance = Math.hypot(dx, dy) || 1;
        const radius = 118;
        let force = 0;

        if (hovering && !reducedMotion && distance < radius) {
          force = Math.pow(1 - distance / radius, 2);
          x += (dx / distance) * force * 34 + Math.sin(time * 0.006 + particle.seed) * force * 11;
          y += (dy / distance) * force * 34 + Math.cos(time * 0.005 + particle.seed) * force * 8;
        }

        context.fillStyle = force > 0.42
          ? `rgba(197,255,0,${Math.min(1, particle.alpha + 0.2)})`
          : `rgba(245,245,239,${particle.alpha})`;
        context.fillText(particle.char, x, y);
      }
    };

    const animate = (time: number) => {
      // The portrait used to redraw thousands of glyphs at the display refresh
      // rate for as long as the pointer remained over it. 30 fps preserves the
      // interaction while substantially reducing renderer/GPU pressure.
      if (time - lastPaint < 1000 / 30) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      lastPaint = time;
      draw(time);
      if (hovering && visible && !reducedMotion) frame = window.requestAnimationFrame(animate);
    };

    const rebuild = () => {
      if (!source.complete || !source.naturalWidth || !sampleContext) return;
      const rect = container.getBoundingClientRect();
      // A high-DPI backing store multiplies canvas memory by DPR squared. ASCII
      // glyphs do not benefit from native 2x/3x resolution, so cap it here.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      cell = rect.width < 520 ? 11 : 10;
      const columns = Math.max(1, Math.floor(rect.width / cell));
      const rows = Math.max(1, Math.floor(rect.height / cell));
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      offscreen.width = columns;
      offscreen.height = rows;

      sampleContext.clearRect(0, 0, columns, rows);
      // Fill the hero without stretching the photograph. A proportional
      // "cover" crop removes only the lateral excess and keeps the streamer
      // positioned toward the right side of the composition.
      const coverScale = Math.max(columns / source.naturalWidth, rows / source.naturalHeight);
      const visibleWidth = columns / coverScale;
      const visibleHeight = rows / coverScale;
      const focusX = source.naturalWidth * 0.58;
      const sourceX = Math.max(0, Math.min(source.naturalWidth - visibleWidth, focusX - visibleWidth * 0.58));
      const sourceY = Math.max(0, (source.naturalHeight - visibleHeight) * 0.5);
      sampleContext.drawImage(source, sourceX, sourceY, visibleWidth, visibleHeight, 0, 0, columns, rows);
      const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
      const next: AsciiParticle[] = [];

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = (row * columns + column) * 4;
          const normalizedX = column / Math.max(1, columns - 1);
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
          const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
          if (saturation < 11 && luminance > 92) continue;
          const contrast = Math.max(0, Math.min(255, (luminance - 105) * 1.65 + 105));
          if (contrast < 48) continue;
          const normalized = contrast / 255;
          const symbolIndex = Math.min(symbols.length - 1, Math.floor(normalized * (symbols.length - 1)));
          const fadeProgress = Math.max(0, Math.min(1, (normalizedX - 0.015) / 0.34));
          const horizontalFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
          next.push({
            x: column * cell + cell / 2,
            y: row * cell + cell / 2,
            char: symbols[symbolIndex],
            alpha: (0.22 + normalized * 0.78) * horizontalFade,
            seed: column * 0.77 + row * 1.31,
          });
        }
      }

      particles = next;
      draw();
    };

    const onMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      if (!hovering) {
        hovering = true;
        window.cancelAnimationFrame(frame);
        if (visible) frame = window.requestAnimationFrame(animate);
      }
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        hovering = false;
        window.cancelAnimationFrame(frame);
        draw();
      }, 500);
    };
    const onLeave = () => {
      hovering = false;
      window.clearTimeout(idleTimer);
      pointerX = -999;
      pointerY = -999;
      window.cancelAnimationFrame(frame);
      draw();
    };

    source.addEventListener("load", rebuild);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    const observer = new ResizeObserver(rebuild);
    observer.observe(container);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        window.cancelAnimationFrame(frame);
      } else {
        draw();
      }
    }, { threshold: 0.01 });
    visibilityObserver.observe(container);
    if (source.complete) rebuild();

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      observer.disconnect();
      visibilityObserver.disconnect();
      source.removeEventListener("load", rebuild);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateHero = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const distance = Math.max(window.innerHeight * 0.72, 520);
        setHeroScroll(Math.min(window.scrollY / distance, 1));
        const marker = window.innerHeight * 0.32;
        let current = "home";
        for (const id of ["home", ...sections]) {
          const element = document.getElementById(id);
          if (element && element.getBoundingClientRect().top <= marker) current = id;
        }
        setActiveSection(current);
      });
    };
    updateHero();
    window.addEventListener("scroll", updateHero, { passive: true });
    window.addEventListener("resize", updateHero);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateHero);
      window.removeEventListener("resize", updateHero);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const todayKey = brazilToday ? formatBrazilDay(brazilToday) : "";
  const ownerBirthday = todayKey === "12/08";
  const playerBirthday = Boolean(registeredPlayerBirthday && registeredPlayerBirthday === todayKey);
  const birthdayMode = ownerBirthday || playerBirthday;
  const communityPower = Math.min(96, 42 + chatStep * 6);
  const creaturePower = Math.max(12, 58 - chatStep * 5);
  const copyFeaturedVideoLink = async () => {
    await navigator.clipboard.writeText(featuredVideo.video_url);
    setVideoLinkCopied(true);
    window.setTimeout(() => setVideoLinkCopied(false), 1800);
  };

  useEffect(() => {
    if (!contactOpen && !mediaKitOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContactOpen(false);
        setMediaKitOpen(false);
      }
    };
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contactOpen, mediaKitOpen]);

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("website") || captchaAnswer.trim() !== "13") {
      setContactStatus("invalid");
      return;
    }
    if(!isSupabaseConfigured){setContactStatus("error");return;}
    setContactStatus("sending");
    const { error } = await getSupabaseBrowserClient().rpc("submit_contact_message",{p_sender_name:String(data.get("name")??""),p_sender_email:String(data.get("email")??""),p_company:String(data.get("company")??""),p_contact_type:String(data.get("contact_type")??""),p_subject:String(data.get("subject")??""),p_message:String(data.get("message")??""),p_human_answer:Number(captchaAnswer),p_website:String(data.get("website")??"")});
    if(error)setContactStatus(error.message.includes("rate_limited")?"error":"invalid");else{setContactStatus("validated");event.currentTarget.reset();setCaptchaAnswer("");}
  };
  const featuredVideoId = getYouTubeId(featuredVideo.video_url);
  const featuredThumbnail = featuredVideo.thumbnail_url || (featuredVideoId ? `https://i.ytimg.com/vi/${featuredVideoId}/maxresdefault.jpg` : "");
  const nextLive = scheduleEvents[0];
  const followingLives = scheduleEvents.slice(1,4);
  const officialChannels = officialLinks.channels.filter((channel)=>channel.platform&&channel.url);
  const [mediaKitLead,...mediaKitAccentParts] = commercialContent.coverTitle.split(". ");
  const [differenceLead,...differenceAccentParts] = commercialContent.differenceTitle.split(". ");

  return (
    <main>
      <div className="noise" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => { closeMenu(); setActiveSection("home"); }} aria-label="Thenees, início">
          THENEES<span>°</span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span>{menuOpen ? "FECHAR" : "MENU"}</span><b>{menuOpen ? "×" : "+"}</b>
        </button>
        <nav id="main-navigation" className={menuOpen ? "nav open" : "nav"} aria-label="Navegação principal">
          <a className={activeSection === "home" ? "active" : ""} aria-current={activeSection === "home" ? "page" : undefined} href="#home" onClick={() => { closeMenu(); setActiveSection("home"); }}>Home</a>
          {sections.map((item) => <a className={activeSection === item ? "active" : ""} aria-current={activeSection === item ? "page" : undefined} key={item} href={`#${item}`} onClick={() => { closeMenu(); setActiveSection(item); }}>{item}</a>)}
        </nav>
        {liveStatus.isLive && liveStatus.url ? (
          <a
            className="live-pill is-live"
            href={liveStatus.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Conectado na ${liveStatus.platform}. Abrir transmissão`}
          >
            <i /> CONECTADO <span>/ {liveStatus.platform}</span>
          </a>
        ) : (
          <span className="live-pill is-offline" aria-label="Transmissão desconectada">
            <i /> LIVE DESCONECTADA
          </span>
        )}
      </header>

      <section className="hero" id="home" style={{ "--hero-scroll": heroScroll } as CSSProperties}>
        <div className="hero-scanline" aria-hidden="true" />
        <div className="hero-world" aria-hidden="true">
          <span className="world-label">WORLD 01</span><b>THENEES</b>
          <div className="pixel-star s1" /><div className="pixel-star s2" /><div className="pixel-star s3" /><div className="pixel-star s4" />
          <div className="hero-portal"><i /><i /><i /><span>COMMUNITY<br />GATEWAY</span></div>
        </div>
        <div className="hero-fx" aria-hidden="true"><i /><i /><i /><span>THENEES_OS // LIVE COMMUNITY PROTOCOL</span></div>
        <div className="hero-copy">
          <div className="eyebrow"><span>{heroContent.eyebrow}</span><span>{heroContent.version}</span></div>
          <div className="hero-title-wrap"><span className="hero-badge" aria-label={`Sistema online. Horário de Brasília: ${time}`}><i /> SISTEMA ONLINE <b>{time}</b></span><h1><span>{heroContent.titleLine1}</span><br /><span>{heroContent.titleLine2Lead} <em>{heroContent.titleLine2Accent}</em></span><br /><span>{heroContent.titleLine3}</span></h1></div>
          <div className="hero-bottom">
            <p>{heroContent.subtitle}<br /><strong>{heroContent.description}</strong></p>
            <div className="actions">
              <a className="button primary" href={heroContent.primaryHref}>{heroContent.primaryLabel} <span>↗</span></a>
              <a className="button secondary" href={heroContent.secondaryHref}>{heroContent.secondaryLabel} <span>↓</span></a>
            </div>
          </div>
        </div>
        <aside className="system-card" aria-label="Status do sistema">
          <div className="system-head"><span>THENEES_OS</span><span>SYS.01</span></div>
          <div className="avatar-stage">
            <div className="crosshair horizontal" /><div className="crosshair vertical" />
            <div className="pixel-face"><span className="eye left" /><span className="eye right" /><span className="smile" /></div>
            <span className="coord top">X: 024</span><span className="coord bottom">Y: 168</span>
          </div>
          <div className="system-row active"><span><i /> SYSTEM</span><b>ONLINE</b></div>
          <div className="system-row"><span>VIEWERS</span><b>142</b></div>
          <div className="system-row"><span>THENEES XP</span><b>028410</b></div>
          <div className="system-row"><span>LOCAL TIME</span><b>{time}</b></div>
        </aside>
        <figure className="hero-portrait" ref={portraitRef}>
          <canvas className="ascii-canvas" ref={asciiCanvasRef} aria-hidden="true" />
          <figcaption><span>THENEES / PLAYER 01</span><b>STREAMER + CREATOR</b></figcaption>
        </figure>
        <div className="hero-level" aria-hidden="true"><span>LVL</span><b>01</b><i><em /></i><small>EXPLORE O UNIVERSO</small></div>
        <div className="scroll-cue"><i /> ROLE PARA ENTRAR <span>↓</span></div>
        <div className="hero-transition" aria-hidden="true"><span>LOADING NEXT LEVEL</span><i /></div>
      </section>

      <section className="manifesto" id="sobre">
        <div className="section-tag"><span>01</span><b>QUEM É O THENEES</b></div>
        <div className="manifesto-grid">
          <h2>STREAMER POR ESCOLHA.<br />CAOS POR <span>NATUREZA.</span></h2>
          <div>
            <p>{siteContent.aboutText}</p>
            <a className="text-link" href="#comunidade">CONHEÇA A HISTÓRIA <span>→</span></a>
          </div>
        </div>
        <div className="personal-heading">
          <span>THENEES_PROFILE.DAT</span>
          <p>Informações importantes, gostos altamente discutíveis e algumas habilidades que realmente podem ser colocadas em um briefing.</p>
        </div>
        <div className="personal-inventory" aria-label="Perfil pessoal e profissional do Thenees">
          {profileItems.map((item, index) => item.item_key === "music" ? <article className="profile-music-card" key={item.item_key}><span>ITEM_{String(index + 1).padStart(2,"0")}</span><small>{item.label}</small><a className="profile-music" href={item.link_url ?? "#"} target="_blank" rel="noreferrer"><strong>{item.value}</strong><b>{item.helper_text}</b></a><div className="pixel-equalizer" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><i>TRILHA SONORA PESSOAL</i></article> : <article key={item.item_key}><span>ITEM_{String(index + 1).padStart(2,"0")}</span><small>{item.label}</small><strong>{item.value}</strong><i>{item.helper_text}</i></article>)}
        </div>
        <div className="ticker"><div>LIVE • GAME • CAOS CONTROLADO • COMUNIDADE • LIVE • GAME • CAOS CONTROLADO • COMUNIDADE •</div></div>
      </section>

      <section className="split-section" id="live">
        <div className="live-panel dark-panel">
          <div className="panel-top"><span>02 / VÍDEOS</span><span className="video-managed">DESTAQUE EDITORIAL</span></div>
          <div className="live-screen">
            {videoActive && featuredVideoId ? <iframe
              src={`https://www.youtube-nocookie.com/embed/${featuredVideoId}?rel=0&autoplay=1`}
              title={featuredVideo.title}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            /> : <div className="video-preview">
              {featuredThumbnail && <img src={featuredThumbnail} alt={`Capa do vídeo ${featuredVideo.title}`} loading="lazy" />}
              <button className="video-play" type="button" onClick={() => setVideoActive(true)} aria-label="Reproduzir vídeo">▶</button>
              <div className="video-preview-actions">
                <button type="button" onClick={copyFeaturedVideoLink}>{videoLinkCopied ? "LINK COPIADO!" : "CLIQUE E COPIE O LINK"}</button>
                <a href={featuredVideo.video_url} target="_blank" rel="noreferrer">ASSISTA NO YOUTUBE ↗</a>
              </div>
            </div>}
          </div>
          <div className="platforms"><a className="channel-link" href={officialLinks.youtubeUrl} target="_blank" rel="noreferrer">YOUTUBE / THENEES ↗</a></div>
        </div>
        <div className="schedule-panel">
          <div className="panel-top"><span>AGENDA DE TRANSMISSÕES</span><span>FUSO / BRT</span></div>
          <div className={birthdayMode ? "schedule-summary birthday-mode" : "schedule-summary"}>
            <strong>{birthdayMode ? (playerBirthday ? "HOJE É SEU ANIVERSÁRIO" : "HOJE É MEU ANIVERSÁRIO") : "HOJE / BRASIL"}</strong>
            <span>{nextLive ? `PRÓXIMA LIVE · ${formatScheduleDate(nextLive.starts_at).date} · ${formatScheduleDate(nextLive.starts_at).hour}` : "AGENDA SENDO PREPARADA"}</span>
            {nextLive && <div className="schedule-summary-details"><b>{nextLive.title}</b><em>JOGO / {nextLive.game || "A DEFINIR"}</em></div>}
            <small>{birthdayMode ? "PARTY MODE" : nextLive?.platform ?? "SEM TRANSMISSÃO AGENDADA"}</small>
          </div>
          {followingLives.map((event, i) => {
            const formatted = formatScheduleDate(event.starts_at);
            const isOwnerBirthday = formatted.date === "12/08";
            return (
            <article className={isOwnerBirthday ? "schedule birthday-event" : "schedule"} key={event.id}>
              <span>{formatted.day}<small>{formatted.date}</small></span><b>{formatted.hour}</b>
              <div><p>{isOwnerBirthday ? "LIVE DE ANIVERSÁRIO" : event.title}</p><small>JOGO / {event.game || "A DEFINIR"}</small></div>
              <em>{event.platform}</em><i>{String(i + 1).padStart(2, '0')}</i>
            </article>
          )})}
          {!nextLive && <div className="schedule-empty">NENHUMA LIVE PUBLICADA NO MOMENTO.</div>}
          <div className="schedule-admin"><span>HORÁRIO · TÍTULO · JOGO · PLATAFORMA</span><b>GERENCIADO NO THENEES CONTROL</b></div>
          <p className="tiny-note">* Horários sujeitos a atualizações no painel, atrasos humanos e eventos aleatórios.</p>
        </div>
      </section>

      <section className="game-section" id="game">
        <div className="section-tag"><span>03</span><b>O GAME</b></div>
        <div className="game-layout">
          <div><p className="kicker">EM DESENVOLVIMENTO <i /></p><h2>NA LIVE, VOCÊ JOGA.<br /><span>NO OFF, VOCÊ EVOLUI.</span></h2></div>
          <div className="game-copy"><p>{siteContent.gameText}</p><a className="button ink" href="/jogar">ACESSAR {gameSettings.name.toUpperCase()} <span>↗</span></a></div>
        </div>
        <div className="mode-switch" role="group" aria-label="Conheça os modos do game">
          <button className={gameMode === "live" ? "active" : ""} onClick={() => setGameMode("live")}><span>01</span> DURANTE A LIVE</button>
          <button className={gameMode === "profile" ? "active" : ""} onClick={() => setGameMode("profile")}><span>02</span> QUANDO ESTIVER OFF</button>
        </div>
        <div className="game-demo">
          {gameMode === "live" ? (
            <div className="chat-mode">
              <div className="demo-copy"><span className="demo-label"><i /> LIVE MODE</span><h3>O CHAT É O<br />CONTROLE.</h3><p>Comandos, follows, subs, bits e donates podem ativar batalhas, buffs, itens e eventos coletivos sem ninguém sair da transmissão.</p><div className="live-events" aria-label="Eventos que afetam o game">{Object.entries(adminLiveEventEffectsPreview).map(([key, event]) => <button type="button" className={selectedLiveEvent === key ? "active" : ""} aria-pressed={selectedLiveEvent === key} key={key} onClick={() => setSelectedLiveEvent(key as keyof typeof adminLiveEventEffectsPreview)}>{event.label}</button>)}</div><div className="event-explanation" aria-live="polite"><small>EFEITO / {adminLiveEventEffectsPreview[selectedLiveEvent].label}</small><strong>{adminLiveEventEffectsPreview[selectedLiveEvent].title}</strong><p>{adminLiveEventEffectsPreview[selectedLiveEvent].effect}</p><em>CONTEÚDO EDITÁVEL NO ADMIN</em></div><div className="community-rule"><small>REGRA_01 / SEM PAY-TO-WIN</small><strong>A COMUNIDADE<br />SEMPRE GANHA.</strong><p>O apoio muda o caminho e aumenta o caos — nunca compra a vitória de uma pessoa sobre as outras.</p></div><div className="command-list"><code>!atacar</code><code>!defender</code><code>!inventário</code><code>!grupo</code></div></div>
              <div className="chat-window"><div className="demo-bar"><b>CHAT / RAID_042</b><span>● 142 ONLINE</span></div><div className="chat-lines"><div className="animated-chat" aria-live="polite">{chatBattleSequence.slice(0, Math.min(chatStep, chatBattleSequence.length)).map((message, index) => <p className={`chat-message ${message.type}`} key={`${message.name}-${index}`}><b className={message.type === "bot" ? "lime-name" : ""}>{message.name}</b><span>{message.text}</span></p>)}{chatStep < chatBattleSequence.length && <div className="bot-typing"><i /><i /><i /><span>NEESBOT PROCESSANDO EVENTO</span></div>}</div><div className="battle-status"><div className="meter-row"><span>COMUNIDADE</span><i><em style={{ width: `${communityPower}%` }} /></i><strong>{communityPower}%</strong></div><div className="meter-row creature"><span>CRIATURA</span><i><em style={{ width: `${creaturePower}%` }} /></i><strong>{creaturePower}%</strong></div></div><div className="chat-input">ENVIAR UMA MENSAGEM <span>↵</span></div></div></div>
            </div>
          ) : (
            <div className="profile-mode">
              <div className="demo-copy"><span className="demo-label">◫ OFFLINE MODE</span><h3>SEU BONECO<br />CONTINUA VIVO.</h3><p>Entre no site quando quiser para acompanhar o personagem, equipar itens, ver conquistas e se preparar para a próxima live.</p><div className="profile-actions"><span>PERFIL</span><span>INVENTÁRIO</span><span>CONQUISTAS</span><span>RANKING</span></div></div>
              <div className="character-card"><div className="demo-bar"><b>MEU PERSONAGEM</b><span>ÚLTIMO SAVE: 02H</span></div><div className="character-content"><div className="mini-avatar"><span className="mini-eye left" /><span className="mini-eye right" /><i /></div><div className="char-title"><small>PLAYER #0142</small><h4>CAOSMAGO</h4><span>LVL 28 / CLASSE: IMPROVISADOR</span></div><div className="xp"><span>XP PARA O PRÓXIMO NÍVEL</span><b>████████░░ 8.410 / 10.000</b></div><div className="inventory"><span>ITENS EQUIPADOS</span><div><i>⚔</i><i>⬡</i><i>✦</i><i>?</i></div></div><div className="char-stats"><span>VITÓRIAS <b>18</b></span><span>CAOS CAUSADO <b>92%</b></span><span>RANK <b>#42</b></span></div></div></div>
            </div>
          )}
        </div>
        <div className="feature-grid">
          <article><b>01</b><div className="feature-icon pixel-chat" aria-hidden="true"><i /><i /><i /></div><h3>JOGUE PELO CHAT</h3><p>Comandos simples viram ações dentro do game durante a live.</p></article>
          <article><b>02</b><div className="feature-icon pixel-player" aria-hidden="true"><i /><i /></div><h3>UM BONECO SÓ SEU</h3><p>Seu personagem mantém nível, itens e história entre as transmissões.</p></article>
          <article><b>03</b><div className="feature-icon pixel-level" aria-hidden="true"><i /><i /><i /><span>XP</span></div><h3>EVOLUÇÃO CONTÍNUA</h3><p>Acesse seu perfil no off e prepare-se para a próxima aventura.</p></article>
        </div>
      </section>

      <section className="community-section" id="comunidade">
        <div className="community-intro">
          <div className="section-tag"><span>04</span><b>COMUNIDADE</b></div>
          <h2>NINGUÉM JOGA<br />SOZINHO.</h2>
          <p>{siteContent.communityText}</p>
          <a className="button primary" href={officialLinks.discordUrl} target="_blank" rel="noreferrer">ENTRAR NO DISCORD <span>↗</span></a>
        </div>
        <div className="community-stats">
          {communityMetrics.slice(0,4).map((metric)=><div key={metric.metric_key}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.helper_text}</small></div>)}
          <div className="quote-wall">
            <div className="quote-head"><span>!QUOTE / ARQUIVO DA COMUNIDADE</span><small>{String(quoteIndex + 1).padStart(2, "0")} / {String(communityQuotes.length).padStart(2, "0")}</small></div>
            <blockquote key={quoteIndex}>“{communityQuotes[quoteIndex]?.quote_text}”</blockquote>
            <div className="quote-meta"><strong>— {communityQuotes[quoteIndex]?.author_name}</strong><span>{communityQuotes[quoteIndex]?.platform} · {communityQuotes[quoteIndex]?.quoted_at ? new Date(communityQuotes[quoteIndex].quoted_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"}) : ""}</span></div>
            <div className="quote-progress">{communityQuotes.map((quote, index) => <i className={quoteIndex === index ? "active" : ""} key={quote.id} />)}</div>
            <div className="quote-bot-confirm"><span>NEESBOT / RESPOSTA NO CHAT</span><p>@{communityQuotes[quoteIndex]?.author_name}, sua frase entrou para o arquivo da comunidade! Veja em <b>{officialLinks.communityUrl}</b></p></div>
          </div>
        </div>
      </section>

      <section className="partners" id="parcerias">
        <div className="section-tag"><span>05</span><b>PARCERIAS</b></div>
        <div className="partners-content"><h2>SUA MARCA.<br />NOSSO <span>CAOS.</span></h2><div><p>{siteContent.partnersText}</p><button className="text-link contact-trigger" type="button" onClick={() => setMediaKitOpen(true)}>ACESSAR MEDIA KIT <span>↗</span></button><button className="text-link contact-trigger" type="button" onClick={() => { setContactOpen(true); setContactStatus("idle"); }}>FALAR COM O THENEES <span>↗</span></button><div className="partner-official-links">{officialChannels.map((channel)=><a key={channel.platform} href={channel.url} target="_blank" rel="noreferrer">{channel.platform} ↗</a>)}</div></div></div>
        <div className="partner-strip"><span>INTEGRAÇÕES</span><span>CONTEÚDO</span><span>EVENTOS</span><span>BRANDED GAMES</span></div>
        <div className="partner-showcase" aria-label="Marcas e parceiros"><header><span>MARCAS QUE PODEM ENTRAR NO JOGO</span><small>ESPAÇOS PREPARADOS PARA LOGOS OFICIAIS</small></header><div>{commercialContent.partners.filter((partner)=>partner.active).map((partner,index)=><article key={`${partner.name}-${index}`}>{partner.logo_url?<img src={partner.logo_url} alt={partner.name} />:<b>{partner.name}</b>}<span>{String(index+1).padStart(2,"0")}</span></article>)}</div></div>
      </section>

      <section className="lab" id="lab">
        <div className="lab-copy"><div className="section-tag"><span>06</span><b>THENEES LAB</b></div><p className="kicker">EXPERIMENTOS EM ANDAMENTO <i /></p><h2>COISAS QUE<br />TALVEZ <span>FUNCIONEM.</span></h2><p>{siteContent.labText}</p><a className="button primary" href="#control">EXPLORAR O LAB <span>→</span></a></div>
        <div className="lab-terminal">
          <div className="terminal-bar"><span>THENEES_LAB.EXE</span><div className="lab-signal"><b>● LAB ONLINE</b><i /><i /><i /></div></div>
          <div className="terminal-body lab-board">
            <div className="lab-board-head"><div><span>PAINEL DE EXPERIMENTOS</span><strong>3 PROJETOS EM TESTE</strong></div><small>BUILD 0.6.2 / COMUNIDADE</small></div>
            <div className="lab-projects">
              <article className="lab-project active"><span>01</span><div><small>GAME + CHAT</small><strong>CHATBATTLE</strong><p>Comandos da comunidade viram ações dentro do jogo.</p></div><aside><b>EM CONSTRUÇÃO</b><i><em style={{ width: "72%" }} /></i><small>72%</small></aside></article>
              <article className="lab-project"><span>02</span><div><small>FERRAMENTA</small><strong>NEESBOT</strong><p>Eventos, quotes, novos players e aniversários na Twitch e Kick.</p></div><aside><b>PROTÓTIPO</b><i><em style={{ width: "46%" }} /></i><small>46%</small></aside></article>
              <article className="lab-project"><span>03</span><div><small>UTILIDADE</small><strong>LINKS DO CHAT</strong><p>Links curtos, rastreáveis e controlados pelo painel.</p></div><aside><b>EM TESTE</b><i><em style={{ width: "28%" }} /></i><small>28%</small></aside></article>
            </div>
            <div className="lab-log"><span>ÚLTIMO EVENTO</span><p><b>NEESBOT:</b> nova ideia detectada. chance de funcionar: <em>63%</em><i className="cursor">_</i></p></div>
          </div>
        </div>
      </section>

      <section className="control" id="control">
        <div className="control-ui">
          <div className="control-nav"><b>THENEES° <span>CONTROL</span></b><i>● CONNECTED</i></div>
          <div className="control-grid"><aside><span>OVERVIEW</span><span>LIVE CONTROL</span><span>GAME MASTER</span><span>LINKS</span><span>BOT</span><span>CONTENT</span></aside><div className="control-main"><small>GOOD EVENING, THENEES.</small><h3>ALL SYSTEMS<br /><span>OPERATIONAL.</span></h3><div className="control-cards"><div>LIVE STATUS<strong>OFFLINE</strong></div><div>BOT STATUS<strong className="green">ONLINE</strong></div><div>ACTIVE LINKS<strong>24</strong></div></div></div></div>
        </div>
        <div className="control-copy"><div className="section-tag"><span>SYS</span><b>EM BREVE / ACESSO RESTRITO</b></div><h2>THENEES<br /><span>CONTROL.</span></h2><p>O painel central para controlar o site, a live, o game, o bot e tudo que ainda nem inventamos.</p><div className="locked">▣ ADMIN ACCESS <b>LOCKED</b></div></div>
      </section>

      <footer className="site-footer">
        <div className="footer-cta">
          <span>FIM DA PÁGINA / INÍCIO DO PRÓXIMO NÍVEL</span>
          <h2>A LIVE TERMINA.<br /><em>A COMUNIDADE CONTINUA.</em></h2>
          <a className="footer-contact" href={`mailto:${officialLinks.email}`}>VAMOS CRIAR ALGO JUNTOS <b>↗</b></a>
        </div>
        <div className="footer-grid">
          <div className="footer-identity">
            <div className="footer-brand">THENEES<span>°</span></div>
            <p>{siteContent.footerTagline}</p>
            <div className="footer-system"><i /> SITE ONLINE <span>/</span> LIVE DESCONECTADA</div>
            <div className="footer-official-links">{officialChannels.map((channel)=><a key={channel.platform} href={channel.url} target="_blank" rel="noreferrer">{channel.platform} ↗</a>)}</div>
          </div>
          <nav className="footer-links" aria-label="Navegação do rodapé"><span>EXPLORE</span><a href="#home">HOME</a><a href="#sobre">SOBRE</a><a href="#game">CHATBATTLE</a><a href="#comunidade">COMUNIDADE</a><a href="#parcerias">PARCERIAS</a></nav>
          <div className="footer-links footer-business"><span>CONTATO</span><a href={`mailto:${officialLinks.email}`}>{officialLinks.email.toUpperCase()}</a><p>{siteContent.footerBusinessText}</p><div className="footer-local"><i className={`weather-pixel ${santosWeather.icon}`} aria-hidden="true" /><div><small>SANTOS / SÃO PAULO · BRT / UTC−03</small><b>{time} <span>/</span> {santosWeather.temperature===null?"--°C":`${santosWeather.temperature}°C`} <span>/</span> {santosWeather.label}</b></div></div></div>
        </div>
        <div className="footer-bottom"><span>© 2026 THENEES. TODOS OS DIREITOS RESERVADOS.</span><a href="#home">VOLTAR AO TOPO ↑</a></div>
      </footer>
      {contactOpen && <div className="contact-backdrop" role="presentation" onMouseDown={() => setContactOpen(false)}>
        <section className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="contact-modal-bar"><span>CONTATO_THENEES.EXE</span><button type="button" onClick={() => setContactOpen(false)} aria-label="Fechar formulário">×</button></div>
          <div className="contact-modal-body">
            <div className="contact-modal-intro"><small>CANAL DIRETO / PARCERIAS</small><h2 id="contact-title">VAMOS CRIAR<br /><span>ALGO JUNTOS.</span></h2><p>Conte sobre sua marca, projeto, evento ou ideia perigosamente próxima de funcionar.</p><div><i /> RESPOSTA HUMANA. SEM AUTO-REPLY ROBÓTICO.</div></div>
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <label>NOME<input name="name" type="text" autoComplete="name" required placeholder="COMO DEVEMOS TE CHAMAR?" /></label>
              <label>E-MAIL<input name="email" type="email" autoComplete="email" required placeholder="VOCE@EMAIL.COM" /></label>
              <label>EMPRESA / PROJETO<input name="company" type="text" autoComplete="organization" placeholder="NOME DA MARCA OU PROJETO" /></label>
              <label>TIPO DE CONTATO<select name="contact_type" defaultValue="PARCERIA"><option>PARCERIA</option><option>PROJETO CRIATIVO</option><option>EVENTO</option><option>IMPRENSA</option><option>OUTRO</option></select></label>
              <label>ASSUNTO<select name="subject" defaultValue=""><option value="" disabled>SELECIONE UMA MISSÃO</option><option>PARCERIA</option><option>PROJETO CRIATIVO</option><option>EVENTO</option><option>IMPRENSA</option><option>OUTRO CAOS</option></select></label>
              <label>MENSAGEM<textarea name="message" required minLength={20} rows={5} placeholder="CONTE A IDEIA, PRAZO E O QUE VOCÊ IMAGINOU..." /></label>
              <input className="contact-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="contact-captcha"><div><span>VERIFICAÇÃO HUMANA</span><b>07 + 06 = ?</b></div><input value={captchaAnswer} onChange={(event) => { setCaptchaAnswer(event.target.value); setContactStatus("idle"); }} inputMode="numeric" aria-label="Resposta da verificação: sete mais seis" required placeholder="00" /></div>
              {contactStatus === "invalid" && <p className="contact-feedback error" role="alert">RESPOSTA INCORRETA OU DADOS INVÁLIDOS. REVISE E TENTE NOVAMENTE.</p>}
              {contactStatus === "error" && <p className="contact-feedback error" role="alert">NÃO FOI POSSÍVEL ENVIAR AGORA OU O LIMITE DE TENTATIVAS FOI ATINGIDO.</p>}
              {contactStatus === "validated" && <p className="contact-feedback success" role="status">MENSAGEM ENVIADA. ELA JÁ ESTÁ NO THENEES CONTROL.</p>}
              <button className="button primary contact-submit" type="submit" disabled={contactStatus === "sending"}>{contactStatus === "sending" ? "ENVIANDO..." : "ENVIAR MENSAGEM"} <span>↗</span></button>
              <small className="contact-security">VERIFICAÇÃO HUMANA · HONEYPOT · LIMITE DE 3 MENSAGENS POR E-MAIL A CADA HORA.</small>
            </form>
          </div>
        </section>
      </div>}
      {mediaKitOpen && <div className="contact-backdrop media-kit-backdrop" role="presentation" onMouseDown={() => setMediaKitOpen(false)}>
        <section className="media-kit-modal" role="dialog" aria-modal="true" aria-labelledby="media-kit-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="contact-modal-bar"><span>THENEES_MEDIA_KIT.V01</span><button type="button" onClick={() => setMediaKitOpen(false)} aria-label="Fechar Media Kit">×</button></div>
          <div className="media-kit-cover">
            <div><small>{commercialContent.coverEyebrow}</small><h2 id="media-kit-title">{mediaKitLead}.<br /><span>{mediaKitAccentParts.join(". ")}</span></h2><p>{commercialContent.coverDescription}</p></div>
            <aside><span>MEDIA KIT</span><b>2026</b><small>BRASIL / BRT</small></aside>
          </div>
          <div className="media-kit-content">
            <section className="media-kit-about"><span>01 / SOBRE</span><h3>{commercialContent.aboutTitle}</h3><p>{commercialContent.aboutText}</p></section>
            <section className="media-kit-metrics"><span>02 / COMUNIDADE</span><div>{communityMetrics.slice(0,4).map((metric)=><article key={metric.metric_key}><small>{metric.label}</small><b>{metric.value}</b><em>{metric.helper_text}</em></article>)}</div></section>
            <section className="media-kit-formats"><span>03 / FORMATOS COMERCIAIS</span><div>{commercialContent.formats.map((format)=><article key={format.title}><b>{format.title}</b><p>{format.description}</p></article>)}</div></section>
            <section className="media-kit-difference"><span>04 / DIFERENCIAL</span><div><h3>{differenceLead}.<br /><em>{differenceAccentParts.join(". ")}</em></h3><p>{commercialContent.differenceText}</p></div></section>
            <section className="media-kit-actions"><div><small>CONTATO COMERCIAL</small><a href={`mailto:${officialLinks.email}`}>{officialLinks.email.toUpperCase()}</a></div><button className="button secondary" type="button" onClick={() => window.print()}>IMPRIMIR / SALVAR PDF <span>↓</span></button><button className="button primary" type="button" onClick={() => { setMediaKitOpen(false); setContactOpen(true); setContactStatus("idle"); }}>SOLICITAR PROPOSTA <span>↗</span></button></section>
            <p className="media-kit-note">CONTEÚDO E MÉTRICAS GERENCIADOS PELO THENEES CONTROL · FONTES AUTOMÁTICAS SERÃO ATIVADAS COM TWITCH E KICK.</p>
          </div>
        </section>
      </div>}
    </main>
  );
}
