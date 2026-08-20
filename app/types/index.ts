export type HeroContent = {
  eyebrow: string; version: string; titleLine1: string; titleLine2Lead: string; titleLine2Accent: string;
  titleLine3: string; subtitle: string; description: string; primaryLabel: string; primaryHref: string;
  secondaryLabel: string; secondaryHref: string;
};
export type ProfileItem = { item_key: string; label: string; value: string; helper_text: string; link_url: string | null; sort_order: number };
export type PublicScheduleEvent = { id:string; starts_at:string; title:string; game:string|null; platform:string; description:string|null };
export type PublicFeaturedVideo = { title:string; video_url:string; thumbnail_url:string|null };
export type PublicCommunityMetric = { metric_key:string;label:string;value:string;helper_text:string|null;source:string };
export type PublicCommunityQuote = { id:string;quote_text:string;author_name:string;platform:string;quoted_at:string };
export type PublicCommercialContent = { coverEyebrow:string;coverTitle:string;coverDescription:string;aboutTitle:string;aboutText:string;differenceTitle:string;differenceText:string;formats:{title:string;description:string}[];partners:{name:string;logo_url:string;active:boolean}[] };
export type SantosWeather = { temperature:number|null;label:string;icon:"sun"|"night"|"cloud"|"rain"|"storm"|"fog" };
export type AsciiParticle = { x: number; y: number; char: string; alpha: number; seed: number };
export type BrazilDate = { year: number; month: number; day: number; weekDay: number };
