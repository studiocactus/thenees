import { useState, useEffect } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  defaultHeroContent,
  defaultProfileItems,
  defaultCommercialContent,
  defaultSiteContent,
  defaultOfficialLinks,
  adminQuotesPreview,
} from "../constants";
import type {
  HeroContent,
  ProfileItem,
  PublicScheduleEvent,
  PublicFeaturedVideo,
  PublicCommunityMetric,
  PublicCommunityQuote,
  PublicCommercialContent,
} from "../types";

export function useSupabaseData() {
  const [heroContent, setHeroContent] = useState<HeroContent>(defaultHeroContent);
  const [profileItems, setProfileItems] = useState<ProfileItem[]>(defaultProfileItems);
  const [registeredPlayerBirthday, setRegisteredPlayerBirthday] = useState<string | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<PublicScheduleEvent[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<PublicFeaturedVideo>({
    title: "Melhores Momentos das Lives! #01",
    video_url: "https://www.youtube.com/watch?v=eiEJdsE7pNI",
    thumbnail_url: "https://i.ytimg.com/vi/eiEJdsE7pNI/maxresdefault.jpg"
  });
  const [siteContent, setSiteContent] = useState(defaultSiteContent);
  const [officialLinks, setOfficialLinks] = useState(defaultOfficialLinks);
  const [communityMetrics, setCommunityMetrics] = useState<PublicCommunityMetric[]>([
    { metric_key: "followers", label: "SEGUIDORES", value: "04.2K", helper_text: "TWITCH + KICK", source: "MANUAL" },
    { metric_key: "active_subs", label: "SUBS ATIVOS", value: "0328", helper_text: "DADOS AUTORIZADOS", source: "MANUAL" },
    { metric_key: "watch_hours", label: "HORAS ASSISTIDAS", value: "18.6K", helper_text: "CALCULADAS PELO SISTEMA", source: "MANUAL" },
    { metric_key: "chaos_clips", label: "CLIPES DO CAOS", value: "01.3K", helper_text: "PROVAS DOCUMENTAIS", source: "MANUAL" },
  ]);
  const [communityQuotes, setCommunityQuotes] = useState<PublicCommunityQuote[]>(
    adminQuotesPreview.map((quote, index) => ({
      id: String(index),
      quote_text: quote.text,
      author_name: quote.author,
      platform: quote.platform,
      quoted_at: quote.date.split("/").reverse().join("-")
    }))
  );
  const [commercialContent, setCommercialContent] = useState<PublicCommercialContent>(defaultCommercialContent);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    const loadPlayerBirthday = async (userId: string | null) => {
      if (!userId) { setRegisteredPlayerBirthday(null); return; }
      const { data } = await supabase.from("game_players").select("birthday,birthday_public,birthday_party_enabled").eq("auth_user_id", userId).maybeSingle();
      if (!data?.birthday || !data.birthday_public || !data.birthday_party_enabled) { setRegisteredPlayerBirthday(null); return; }
      const [, month, day] = data.birthday.split("-");
      setRegisteredPlayerBirthday(month && day ? `${day}/${month}` : null);
    };
    void supabase.auth.getUser().then(({ data }) => void loadPlayerBirthday(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => void loadPlayerBirthday(session?.user.id ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void getSupabaseBrowserClient().from("profile_items").select("item_key,label,value,helper_text,link_url,sort_order").eq("active", true).order("sort_order").then(({ data }) => {
      if (data?.length) setProfileItems(data.map((item) => ({ ...item, helper_text: item.helper_text ?? "" })) as ProfileItem[]);
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    const refreshCommercial = () => supabase.from("site_settings").select("value").eq("key", "commercial_content").maybeSingle().then(({ data }) => {
      if (data?.value && typeof data.value === "object") setCommercialContent({ ...defaultCommercialContent, ...(data.value as Partial<PublicCommercialContent>) });
    });
    void refreshCommercial();
    const channel = supabase.channel("thenees-landing-commercial").on("postgres_changes", { event: "*", schema: "public", table: "site_settings", filter: "key=eq.commercial_content" }, () => void refreshCommercial()).subscribe();
    const refreshFromStorage = (event: StorageEvent) => { if (event.key === "thenees-commercial-content-updated") void refreshCommercial(); };
    const signal = "BroadcastChannel" in window ? new BroadcastChannel("thenees-commercial-content") : null;
    if (signal) signal.onmessage = () => void refreshCommercial();
    window.addEventListener("storage", refreshFromStorage);
    return () => { window.removeEventListener("storage", refreshFromStorage); signal?.close(); void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const refreshSiteSettings = () => getSupabaseBrowserClient().from("site_settings").select("key,value").in("key", ["site_content", "official_links"]).then(({ data }) => {
      for (const item of data ?? []) {
        if (item.key === "site_content" && item.value && typeof item.value === "object") setSiteContent({ ...defaultSiteContent, ...item.value as Partial<typeof defaultSiteContent> });
        if (item.key === "official_links" && item.value && typeof item.value === "object") {
          const links = item.value as Record<string, unknown>;
          const channels = Array.isArray(links.channels) ? links.channels.filter((channel): channel is { platform: string; url: string } => Boolean(channel && typeof channel === "object" && "platform" in channel && "url" in channel)) : defaultOfficialLinks.channels;
          setOfficialLinks({ ...defaultOfficialLinks, twitchUrl: String(links.twitch ?? links.twitchUrl ?? defaultOfficialLinks.twitchUrl), kickUrl: String(links.kick ?? links.kickUrl ?? defaultOfficialLinks.kickUrl), youtubeUrl: String(links.youtube ?? links.youtubeUrl ?? defaultOfficialLinks.youtubeUrl), discordUrl: String(links.discord ?? links.discordUrl ?? defaultOfficialLinks.discordUrl), email: String(links.email ?? defaultOfficialLinks.email), communityUrl: String(links.community ?? links.communityUrl ?? defaultOfficialLinks.communityUrl), channels });
        }
      }
    });
    void refreshSiteSettings();
    const refreshFromStorage = (event: StorageEvent) => { if (event.key === "thenees-official-links-updated") void refreshSiteSettings(); };
    const signal = "BroadcastChannel" in window ? new BroadcastChannel("thenees-official-links") : null;
    if (signal) signal.onmessage = () => void refreshSiteSettings();
    window.addEventListener("storage", refreshFromStorage);
    return () => { window.removeEventListener("storage", refreshFromStorage); signal?.close(); };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    const refreshLiveContent = async () => {
      const [schedule, video] = await Promise.all([
        supabase.from("schedule_events").select("id,starts_at,title,game,platform,description").eq("published", true).gte("starts_at", new Date(Date.now() - 21600000).toISOString()).order("starts_at").limit(4),
        supabase.from("featured_videos").select("title,video_url,thumbnail_url").eq("published", true).order("sort_order").limit(1).maybeSingle(),
      ]);
      if (schedule.data?.length) setScheduleEvents(schedule.data as PublicScheduleEvent[]);
      else setScheduleEvents([]);
      if (video.data) setFeaturedVideo(video.data as PublicFeaturedVideo);
    };
    void refreshLiveContent();
    const channel = supabase.channel("thenees-landing-live-content")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_events" }, () => void refreshLiveContent())
      .on("postgres_changes", { event: "*", schema: "public", table: "featured_videos" }, () => void refreshLiveContent())
      .subscribe();
    const timer = window.setInterval(() => void refreshLiveContent(), 30000);
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void refreshLiveContent(); };
    const refreshFromStorage = (event: StorageEvent) => { if (event.key === "thenees-live-content-updated") void refreshLiveContent(); };
    const liveSignal = "BroadcastChannel" in window ? new BroadcastChannel("thenees-live-content") : null;
    if (liveSignal) liveSignal.onmessage = () => void refreshLiveContent();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("storage", refreshFromStorage);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshWhenVisible); window.removeEventListener("storage", refreshFromStorage); liveSignal?.close(); void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    const refreshCommunity = async () => {
      const [metrics, quotes] = await Promise.all([
        supabase.from("community_metrics").select("metric_key,label,value,helper_text,source").eq("is_public", true),
        supabase.from("community_quotes").select("id,quote_text,author_name,platform,quoted_at").eq("approved", true).order("quoted_at", { ascending: false }).limit(12),
      ]);
      setCommunityMetrics((metrics.data ?? []) as PublicCommunityMetric[]);
      setCommunityQuotes((quotes.data ?? []) as PublicCommunityQuote[]); setQuoteIndex(0);
    };
    void refreshCommunity();
    const channel = supabase.channel("thenees-landing-quotes")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_quotes" }, () => void refreshCommunity())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_metrics" }, () => void refreshCommunity())
      .subscribe();
    const timer = window.setInterval(() => void refreshCommunity(), 30000);
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void refreshCommunity(); };
    const refreshFromStorage = (event: StorageEvent) => { if (event.key === "thenees-community-content-updated") void refreshCommunity(); };
    const communitySignal = "BroadcastChannel" in window ? new BroadcastChannel("thenees-community-content") : null;
    if (communitySignal) communitySignal.onmessage = () => void refreshCommunity();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("storage", refreshFromStorage);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshWhenVisible); window.removeEventListener("storage", refreshFromStorage); communitySignal?.close(); void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void getSupabaseBrowserClient().from("site_settings").select("value").eq("key", "hero_content").maybeSingle().then(({ data }) => {
      if (data?.value && typeof data.value === "object") setHeroContent({ ...defaultHeroContent, ...(data.value as Partial<HeroContent>) });
    });
  }, []);

  return {
    heroContent,
    profileItems,
    registeredPlayerBirthday,
    scheduleEvents,
    featuredVideo,
    siteContent,
    officialLinks,
    communityMetrics,
    communityQuotes,
    commercialContent,
    quoteIndex,
    setQuoteIndex
  };
}
