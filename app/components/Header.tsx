import type { Dispatch, SetStateAction } from "react";

const sections = ["sobre", "live", "game", "comunidade", "parcerias", "lab"];

const liveStatus: { isLive: boolean; platform: "TWITCH" | "KICK" | null; url: string | null } = {
  isLive: false,
  platform: null,
  url: null,
};

type HeaderProps = {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  activeSection: string;
  setActiveSection: (section: string) => void;
};

export function Header({ menuOpen, setMenuOpen, activeSection, setActiveSection }: HeaderProps) {
  const closeMenu = () => setMenuOpen(false);

  return (
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
        {sections.map((item) => (
          <a className={activeSection === item ? "active" : ""} aria-current={activeSection === item ? "page" : undefined} key={item} href={`#${item}`} onClick={() => { closeMenu(); setActiveSection(item); }}>{item}</a>
        ))}
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
  );
}
