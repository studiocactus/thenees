"use client";

import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ManifestoSection } from "./components/ManifestoSection";
import { LiveSection } from "./components/LiveSection";
import { GameSection } from "./components/GameSection";
import { CommunitySection } from "./components/CommunitySection";
import { PartnersSection } from "./components/PartnersSection";
import { LabSection } from "./components/LabSection";
import { ControlSection } from "./components/ControlSection";
import { Footer } from "./components/Footer";
import { useTimeAndWeather } from "./hooks/useTimeAndWeather";
import { useSupabaseData } from "./hooks/useSupabaseData";
import { sections } from "./constants";
import { formatBrazilDay } from "./lib/utils";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mediaKitOpen, setMediaKitOpen] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "invalid" | "sending" | "validated" | "error">("idle");
  const [heroScroll, setHeroScroll] = useState(0);
  const [activeSection, setActiveSection] = useState("home");

  const { time, brazilToday, santosWeather } = useTimeAndWeather();
  const {
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
  } = useSupabaseData();

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

  const todayKey = brazilToday ? formatBrazilDay(brazilToday) : "";
  const ownerBirthday = todayKey === "12/08";
  const playerBirthday = Boolean(registeredPlayerBirthday && registeredPlayerBirthday === todayKey);
  const birthdayMode = ownerBirthday || playerBirthday;
  const officialChannels = officialLinks.channels.filter((channel: any) => channel.platform && channel.url);

  return (
    <main>
      <div className="noise" aria-hidden="true" />
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <HeroSection 
        heroScroll={heroScroll}
        time={time}
        heroContent={heroContent}
      />
      <ManifestoSection 
        siteContent={siteContent}
        profileItems={profileItems}
      />
      <LiveSection
        featuredVideo={featuredVideo}
        officialLinks={officialLinks}
        birthdayMode={birthdayMode}
        scheduleEvents={scheduleEvents}
        playerBirthday={playerBirthday}
      />
      <GameSection siteContent={siteContent} />
      <CommunitySection
        siteContent={siteContent}
        officialLinks={officialLinks}
        communityMetrics={communityMetrics}
        communityQuotes={communityQuotes}
      />
      <PartnersSection
        siteContent={siteContent}
        officialChannels={officialChannels}
        commercialContent={commercialContent}
        setMediaKitOpen={setMediaKitOpen}
        setContactOpen={setContactOpen}
        setContactStatus={setContactStatus}
      />
      <LabSection siteContent={siteContent} />
      <ControlSection />
      <Footer
        siteContent={siteContent}
        officialChannels={officialChannels}
        officialLinks={officialLinks}
        santosWeather={santosWeather}
        time={time}
        contactOpen={contactOpen}
        setContactOpen={setContactOpen}
        mediaKitOpen={mediaKitOpen}
        setMediaKitOpen={setMediaKitOpen}
        contactStatus={contactStatus}
        setContactStatus={setContactStatus}
        captchaAnswer={captchaAnswer}
        setCaptchaAnswer={setCaptchaAnswer}
        commercialContent={commercialContent}
        communityMetrics={communityMetrics}
      />
    </main>
  );
}
