import type { ProfileItem } from "../types";

type ManifestoSectionProps = {
  siteContent: { aboutText: string };
  profileItems: ProfileItem[];
};

export function ManifestoSection({ siteContent, profileItems }: ManifestoSectionProps) {
  return (
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
        {profileItems.map((item, index) => item.item_key === "music" ? (
          <article className="profile-music-card" key={item.item_key}>
            <span>ITEM_{String(index + 1).padStart(2, "0")}</span>
            <small>{item.label}</small>
            <a className="profile-music" href={item.link_url ?? "#"} target="_blank" rel="noreferrer">
              <strong>{item.value}</strong><b>{item.helper_text}</b>
            </a>
            <div className="pixel-equalizer" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <i>TRILHA SONORA PESSOAL</i>
          </article>
        ) : (
          <article key={item.item_key}>
            <span>ITEM_{String(index + 1).padStart(2, "0")}</span>
            <small>{item.label}</small>
            <strong>{item.value}</strong><i>{item.helper_text}</i>
          </article>
        ))}
      </div>
      <div className="ticker"><div>LIVE • GAME • CAOS CONTROLADO • COMUNIDADE • LIVE • GAME • CAOS CONTROLADO • COMUNIDADE •</div></div>
    </section>
  );
}
