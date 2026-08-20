import { useRef, type CSSProperties } from "react";
import { useAsciiEffect } from "../hooks/useAsciiEffect";
import type { HeroContent } from "../types";

type HeroSectionProps = {
  heroScroll: number;
  time: string;
  heroContent: HeroContent;
};

export function HeroSection({ heroScroll, time, heroContent }: HeroSectionProps) {
  const portraitRef = useRef<HTMLElement | null>(null);
  const asciiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useAsciiEffect(portraitRef, asciiCanvasRef);

  return (
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
        <div className="hero-title-wrap">
          <span className="hero-badge" aria-label={`Sistema online. Horário de Brasília: ${time}`}>
            <i /> SISTEMA ONLINE <b>{time}</b>
          </span>
          <h1>
            <span>{heroContent.titleLine1}</span><br />
            <span>{heroContent.titleLine2Lead} <em>{heroContent.titleLine2Accent}</em></span><br />
            <span>{heroContent.titleLine3}</span>
          </h1>
        </div>
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
  );
}
