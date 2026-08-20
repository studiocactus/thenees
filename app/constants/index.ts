import { HeroContent, ProfileItem, PublicCommercialContent } from "../types";

export const sections = ["sobre", "live", "game", "comunidade", "parcerias", "lab"];

// Future Twitch/Kick integration only needs to update this status object.
// Until a real platform confirms the broadcast, the truthful state is offline.
export const liveStatus: { isLive: boolean; platform: "TWITCH" | "KICK" | null; url: string | null } = {
  isLive: false,
  platform: null,
  url: null,
};

// This label will come from the game settings in Thenees Control.
export const gameSettings = { name: "ChatBattle" };

export const defaultOfficialLinks = {
  communityUrl: "https://www.theneees.com.br/#comunidade",
  discordUrl: "https://discord.gg/fUEG3h2ED",
  twitchUrl: "https://www.twitch.tv/thenees",
  kickUrl: "https://kick.com/thenees",
  email: "contato@theneees.com.br",
  youtubeUrl: "https://www.youtube.com/@theneesr",
  channels: [
    { platform: "TWITCH", url: "https://www.twitch.tv/thenees" },
    { platform: "KICK", url: "https://kick.com/thenees" },
    { platform: "YOUTUBE", url: "https://www.youtube.com/@theneesr" },
    { platform: "DISCORD", url: "https://discord.gg/fUEG3h2ED" }
  ],
};

export const defaultSiteContent = {
  aboutText: "Thenees transforma live em playground. Aqui a comunidade não fica só olhando — ela vota, interfere, compete e, ocasionalmente, destrói qualquer chance de vitória.",
  gameText: "Um game persistente que nasce dentro do chat da live. Cada pessoa cria seu personagem, participa usando comandos e, quando a transmissão termina, continua a jornada em sua própria área de perfil.",
  communityText: "Uma comunidade construída para participar, criar memória e transformar cada transmissão em uma experiência coletiva.",
  partnersText: "Projetos criativos, conteúdo autêntico e uma comunidade que realmente participa. Vamos criar algo que as pessoas queiram assistir — e lembrar.",
  labText: "Bots, ferramentas para o chat, encurtador de links, integrações e ideias perigosamente próximas de virar produto.",
  footerTagline: "Streamer, criador e responsável por transformar interação em experiência.",
  footerBusinessText: "Parcerias, projetos, eventos e ideias perigosamente próximas de funcionar."
};

export const defaultCommercialContent: PublicCommercialContent = {
  coverEyebrow: "STREAMER · DIRETOR DE ARTE · CREATOR",
  coverTitle: "MARCAS ENTRAM. A COMUNIDADE JOGA.",
  coverDescription: "Conteúdo, live e experiências interativas construídas para serem vividas — não apenas assistidas.",
  aboutTitle: "THENEES",
  aboutText: "Streamer, Diretor de Arte e criador do ChatBattle. Transformo participação do chat em conteúdo, narrativa e experiências que aproximam pessoas e marcas.",
  differenceTitle: "O CHAT NÃO ASSISTE. ELE DECIDE.",
  differenceText: "No ChatBattle, a marca pode fazer parte da mecânica: ativar eventos, liberar missões coletivas e recompensar toda a comunidade sem comprar a vitória individual.",
  formats: [
    { title: "LIVE PATROCINADA", description: "Produto, desafio e narrativa integrados à transmissão." },
    { title: "BRANDED GAME", description: "Missões, criaturas e recompensas de marca no ChatBattle." },
    { title: "CONTEÚDO", description: "YouTube, cortes, redes sociais e campanhas com direção criativa." },
    { title: "EVENTOS", description: "Presença, cobertura e experiências participativas para a comunidade." }
  ],
  partners: [
    { name: "NVIDIA", logo_url: "", active: true },
    { name: "AMD", logo_url: "", active: true },
    { name: "SAMSUNG", logo_url: "", active: true },
    { name: "FIFINE", logo_url: "", active: true },
    { name: "PARCEIRO 05", logo_url: "", active: true },
    { name: "SUA MARCA AQUI", logo_url: "", active: true }
  ]
};

export const defaultHeroContent: HeroContent = {
  eyebrow: "SISTEMA OPERACIONAL DA COMUNIDADE",
  version: "V.01 / 2026",
  titleLine1: "EU JOGO.",
  titleLine2Lead: "VOCÊS",
  titleLine2Accent: "INTERAGEM.",
  titleLine3: "FUNCIONA.",
  subtitle: "Twitch + Kick + Games + Comunidade",
  description: "Um lugar onde assistir à live é só o começo.",
  primaryLabel: "ASSISTIR AO VIVO",
  primaryHref: "#live",
  secondaryLabel: "CONHECER O GAME",
  secondaryHref: "#game",
};

export const defaultProfileItems: ProfileItem[] = [
  { item_key: "music", label: "MÚSICA PREFERIDA", value: "WITHOUT YOU", helper_text: "AVICII / SPOTIFY ↗", link_url: "https://open.spotify.com/intl-pt/track/6Pgkp4qUoTmJIPn7ReaGxL?si=18d6bc45a881405f", sort_order: 1 },
  { item_key: "food", label: "COMIDA", value: "STROGONOFF DE FRANGO", helper_text: "BUFF DE ENERGIA FAVORITO", link_url: null, sort_order: 2 },
  { item_key: "place", label: "LUGAR", value: "JAPÃO", helper_text: "PONTO DE SPAWN IDEAL", link_url: null, sort_order: 3 },
  { item_key: "dream", label: "SONHO", value: "CONHECER O JAPÃO", helper_text: "MISSÃO PRINCIPAL", link_url: null, sort_order: 4 },
  { item_key: "work", label: "O QUE EU FAÇO", value: "DIRETOR DE ARTE / STREAMER", helper_text: "CLASSE PROFISSIONAL", link_url: null, sort_order: 5 },
  { item_key: "game", label: "JOGO FAVORITO", value: "ROCK N’ ROLL RACING", helper_text: "MEGA DRIVE / RESPONSÁVEL POR BOA PARTE DA PERSONALIDADE", link_url: null, sort_order: 6 },
  { item_key: "skill", label: "SKILL PRINCIPAL", value: "DEITAR SEM SONO", helper_text: "HABILIDADE REALMENTE ÚTIL", link_url: null, sort_order: 7 },
  { item_key: "project", label: "PROJETO ATUAL", value: "SER UM STREAMER MELHOR", helper_text: "QUEST ATIVA", link_url: null, sort_order: 8 },
  { item_key: "fuel", label: "COMBUSTÍVEL CRIATIVO", value: "CONTATO HUMANO", helper_text: "RECURSO CONSUMIDO EM QUANTIDADES DUVIDOSAS", link_url: null, sort_order: 9 },
  { item_key: "hobby", label: "HOBBY FORA DA TELA", value: "MTB", helper_text: "MODO OFFLINE", link_url: null, sort_order: 10 },
  { item_key: "defect", label: "DEFEITO DE FÁBRICA", value: "DURMO POUCO", helper_text: "BUG CONHECIDO, PATCH NÃO PREVISTO", link_url: null, sort_order: 11 },
  { item_key: "rule", label: "REGRA PESSOAL", value: "NÃO DESISTIR ATÉ CONSEGUIR", helper_text: "CÓDIGO-FONTE MORAL", link_url: null, sort_order: 12 },
];

export const adminLiveEventEffectsPreview = {
  follow: { label: "FOLLOW", title: "NOVO ALIADO", effect: "Recarrega uma parte da energia coletiva e adiciona recursos ao inventário compartilhado da comunidade." },
  sub: { label: "SUB", title: "BUFF DE GRUPO", effect: "Ativa um bônus temporário para todos e pode liberar uma missão especial durante a transmissão." },
  bits: { label: "BITS", title: "MEDIDOR DE CAOS", effect: "Alimenta o medidor coletivo. Ao atingir certos marcos, o cenário muda e um evento surpresa começa para todo mundo." },
  donate: { label: "DONATE", title: "EVENTO GLOBAL", effect: "Invoca desafios, modificadores ou chefes especiais. A recompensa conquistada é distribuída para a comunidade inteira." },
} as const;

export const chatBattleSequence = [
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

export const adminQuotesPreview = [
  { text: "Eu vim pela gameplay. Fiquei pelo desastre.", author: "gabi.exe", date: "09/08/2026", platform: "TWITCH" },
  { text: "Tecnicamente não perdemos. Só paramos de ganhar.", author: "pixelmago", date: "02/08/2026", platform: "KICK" },
  { text: "O plano funcionou até a parte em que começou.", author: "luquinhas_77", date: "27/07/2026", platform: "TWITCH" },
] as const;

export const shortDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
export const fullDays = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
