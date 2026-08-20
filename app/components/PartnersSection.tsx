import type { PublicCommercialContent } from "../types";

interface PartnersSectionProps {
  siteContent: any;
  officialChannels: { platform: string; url: string }[];
  commercialContent: PublicCommercialContent;
  setMediaKitOpen: (open: boolean) => void;
  setContactOpen: (open: boolean) => void;
  setContactStatus: (status: "idle" | "invalid" | "sending" | "validated" | "error") => void;
}

export function PartnersSection({
  siteContent,
  officialChannels,
  commercialContent,
  setMediaKitOpen,
  setContactOpen,
  setContactStatus,
}: PartnersSectionProps) {
  return (
    <section className="partners" id="parcerias">
      <div className="section-tag">
        <span>05</span>
        <b>PARCERIAS</b>
      </div>
      <div className="partners-content">
        <h2>
          SUA MARCA.<br />
          NOSSO <span>CAOS.</span>
        </h2>
        <div>
          <p>{siteContent.partnersText}</p>
          <button className="text-link contact-trigger" type="button" onClick={() => setMediaKitOpen(true)}>
            ACESSAR MEDIA KIT <span>↗</span>
          </button>
          <button
            className="text-link contact-trigger"
            type="button"
            onClick={() => {
              setContactOpen(true);
              setContactStatus("idle");
            }}
          >
            FALAR COM O THENEES <span>↗</span>
          </button>
          <div className="partner-official-links">
            {officialChannels.map((channel) => (
              <a key={channel.platform} href={channel.url} target="_blank" rel="noreferrer">
                {channel.platform} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="partner-strip">
        <span>INTEGRAÇÕES</span>
        <span>CONTEÚDO</span>
        <span>EVENTOS</span>
        <span>BRANDED GAMES</span>
      </div>
      <div className="partner-showcase" aria-label="Marcas e parceiros">
        <header>
          <span>MARCAS QUE PODEM ENTRAR NO JOGO</span>
          <small>ESPAÇOS PREPARADOS PARA LOGOS OFICIAIS</small>
        </header>
        <div>
          {commercialContent.partners
            .filter((partner) => partner.active)
            .map((partner, index) => (
              <article key={`${partner.name}-${index}`}>
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt={partner.name} />
                ) : (
                  <b>{partner.name}</b>
                )}
                <span>{String(index + 1).padStart(2, "0")}</span>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
