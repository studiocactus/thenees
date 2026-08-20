import type { FormEvent } from "react";
import type { PublicCommercialContent, PublicCommunityMetric, SantosWeather } from "../types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface FooterProps {
  siteContent: any;
  officialChannels: { platform: string; url: string }[];
  officialLinks: any;
  santosWeather: SantosWeather;
  time: string;
  contactOpen: boolean;
  setContactOpen: (open: boolean) => void;
  mediaKitOpen: boolean;
  setMediaKitOpen: (open: boolean) => void;
  contactStatus: "idle" | "invalid" | "sending" | "validated" | "error";
  setContactStatus: (status: "idle" | "invalid" | "sending" | "validated" | "error") => void;
  captchaAnswer: string;
  setCaptchaAnswer: (answer: string) => void;
  commercialContent: PublicCommercialContent;
  communityMetrics: PublicCommunityMetric[];
}

export function Footer({
  siteContent,
  officialChannels,
  officialLinks,
  santosWeather,
  time,
  contactOpen,
  setContactOpen,
  mediaKitOpen,
  setMediaKitOpen,
  contactStatus,
  setContactStatus,
  captchaAnswer,
  setCaptchaAnswer,
  commercialContent,
  communityMetrics,
}: FooterProps) {
  const [mediaKitLead, ...mediaKitAccentParts] = commercialContent.coverTitle.split(". ");
  const [differenceLead, ...differenceAccentParts] = commercialContent.differenceTitle.split(". ");

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("website") || captchaAnswer.trim() !== "13") {
      setContactStatus("invalid");
      return;
    }
    if (!isSupabaseConfigured) {
      setContactStatus("error");
      return;
    }
    setContactStatus("sending");
    const { error } = await getSupabaseBrowserClient().rpc("submit_contact_message", {
      p_sender_name: String(data.get("name") ?? ""),
      p_sender_email: String(data.get("email") ?? ""),
      p_company: String(data.get("company") ?? ""),
      p_contact_type: String(data.get("contact_type") ?? ""),
      p_subject: String(data.get("subject") ?? ""),
      p_message: String(data.get("message") ?? ""),
      p_human_answer: Number(captchaAnswer),
      p_website: String(data.get("website") ?? ""),
    });
    if (error) {
      setContactStatus(error.message.includes("rate_limited") ? "error" : "invalid");
    } else {
      setContactStatus("validated");
      event.currentTarget.reset();
      setCaptchaAnswer("");
    }
  };

  return (
    <>
      <footer className="site-footer">
        <div className="footer-cta">
          <span>FIM DA PÁGINA / INÍCIO DO PRÓXIMO NÍVEL</span>
          <h2>
            A LIVE TERMINA.<br />
            <em>A COMUNIDADE CONTINUA.</em>
          </h2>
          <a className="footer-contact" href={`mailto:${officialLinks.email}`}>
            VAMOS CRIAR ALGO JUNTOS <b>↗</b>
          </a>
        </div>
        <div className="footer-grid">
          <div className="footer-identity">
            <div className="footer-brand">
              THENEES<span>°</span>
            </div>
            <p>{siteContent.footerTagline}</p>
            <div className="footer-system">
              <i /> SITE ONLINE <span>/</span> LIVE DESCONECTADA
            </div>
            <div className="footer-official-links">
              {officialChannels.map((channel) => (
                <a key={channel.platform} href={channel.url} target="_blank" rel="noreferrer">
                  {channel.platform} ↗
                </a>
              ))}
            </div>
          </div>
          <nav className="footer-links" aria-label="Navegação do rodapé">
            <span>EXPLORE</span>
            <a href="#home">HOME</a>
            <a href="#sobre">SOBRE</a>
            <a href="#game">CHATBATTLE</a>
            <a href="#comunidade">COMUNIDADE</a>
            <a href="#parcerias">PARCERIAS</a>
          </nav>
          <div className="footer-links footer-business">
            <span>CONTATO</span>
            <a href={`mailto:${officialLinks.email}`}>{officialLinks.email.toUpperCase()}</a>
            <p>{siteContent.footerBusinessText}</p>
            <div className="footer-local">
              <i className={`weather-pixel ${santosWeather.icon}`} aria-hidden="true" />
              <div>
                <small>SANTOS / SÃO PAULO · BRT / UTC−03</small>
                <b>
                  {time} <span>/</span> {santosWeather.temperature === null ? "--°C" : `${santosWeather.temperature}°C`} <span>/</span> {santosWeather.label}
                </b>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 THENEES. TODOS OS DIREITOS RESERVADOS.</span>
          <a href="#home">VOLTAR AO TOPO ↑</a>
        </div>
      </footer>

      {contactOpen && (
        <div className="contact-backdrop" role="presentation" onMouseDown={() => setContactOpen(false)}>
          <section className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="contact-modal-bar">
              <span>CONTATO_THENEES.EXE</span>
              <button type="button" onClick={() => setContactOpen(false)} aria-label="Fechar formulário">×</button>
            </div>
            <div className="contact-modal-body">
              <div className="contact-modal-intro">
                <small>CANAL DIRETO / PARCERIAS</small>
                <h2 id="contact-title">
                  VAMOS CRIAR<br />
                  <span>ALGO JUNTOS.</span>
                </h2>
                <p>Conte sobre sua marca, projeto, evento ou ideia perigosamente próxima de funcionar.</p>
                <div>
                  <i /> RESPOSTA HUMANA. SEM AUTO-REPLY ROBÓTICO.
                </div>
              </div>
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <label>
                  NOME
                  <input name="name" type="text" autoComplete="name" required placeholder="COMO DEVEMOS TE CHAMAR?" />
                </label>
                <label>
                  E-MAIL
                  <input name="email" type="email" autoComplete="email" required placeholder="VOCE@EMAIL.COM" />
                </label>
                <label>
                  EMPRESA / PROJETO
                  <input name="company" type="text" autoComplete="organization" placeholder="NOME DA MARCA OU PROJETO" />
                </label>
                <label>
                  TIPO DE CONTATO
                  <select name="contact_type" defaultValue="PARCERIA">
                    <option>PARCERIA</option>
                    <option>PROJETO CRIATIVO</option>
                    <option>EVENTO</option>
                    <option>IMPRENSA</option>
                    <option>OUTRO</option>
                  </select>
                </label>
                <label>
                  ASSUNTO
                  <select name="subject" defaultValue="">
                    <option value="" disabled>SELECIONE UMA MISSÃO</option>
                    <option>PARCERIA</option>
                    <option>PROJETO CRIATIVO</option>
                    <option>EVENTO</option>
                    <option>IMPRENSA</option>
                    <option>OUTRO CAOS</option>
                  </select>
                </label>
                <label>
                  MENSAGEM
                  <textarea name="message" required minLength={20} rows={5} placeholder="CONTE A IDEIA, PRAZO E O QUE VOCÊ IMAGINOU..." />
                </label>
                <input className="contact-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <div className="contact-captcha">
                  <div>
                    <span>VERIFICAÇÃO HUMANA</span>
                    <b>07 + 06 = ?</b>
                  </div>
                  <input
                    value={captchaAnswer}
                    onChange={(event) => {
                      setCaptchaAnswer(event.target.value);
                      setContactStatus("idle");
                    }}
                    inputMode="numeric"
                    aria-label="Resposta da verificação: sete mais seis"
                    required
                    placeholder="00"
                  />
                </div>
                {contactStatus === "invalid" && <p className="contact-feedback error" role="alert">RESPOSTA INCORRETA OU DADOS INVÁLIDOS. REVISE E TENTE NOVAMENTE.</p>}
                {contactStatus === "error" && <p className="contact-feedback error" role="alert">NÃO FOI POSSÍVEL ENVIAR AGORA OU O LIMITE DE TENTATIVAS FOI ATINGIDO.</p>}
                {contactStatus === "validated" && <p className="contact-feedback success" role="status">MENSAGEM ENVIADA. ELA JÁ ESTÁ NO THENEES CONTROL.</p>}
                <button className="button primary contact-submit" type="submit" disabled={contactStatus === "sending"}>
                  {contactStatus === "sending" ? "ENVIANDO..." : "ENVIAR MENSAGEM"} <span>↗</span>
                </button>
                <small className="contact-security">VERIFICAÇÃO HUMANA · HONEYPOT · LIMITE DE 3 MENSAGENS POR E-MAIL A CADA HORA.</small>
              </form>
            </div>
          </section>
        </div>
      )}
      {mediaKitOpen && (
        <div className="contact-backdrop media-kit-backdrop" role="presentation" onMouseDown={() => setMediaKitOpen(false)}>
          <section className="media-kit-modal" role="dialog" aria-modal="true" aria-labelledby="media-kit-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="contact-modal-bar">
              <span>THENEES_MEDIA_KIT.V01</span>
              <button type="button" onClick={() => setMediaKitOpen(false)} aria-label="Fechar Media Kit">×</button>
            </div>
            <div className="media-kit-cover">
              <div>
                <small>{commercialContent.coverEyebrow}</small>
                <h2 id="media-kit-title">
                  {mediaKitLead}.<br />
                  <span>{mediaKitAccentParts.join(". ")}</span>
                </h2>
                <p>{commercialContent.coverDescription}</p>
              </div>
              <aside>
                <span>MEDIA KIT</span>
                <b>2026</b>
                <small>BRASIL / BRT</small>
              </aside>
            </div>
            <div className="media-kit-content">
              <section className="media-kit-about">
                <span>01 / SOBRE</span>
                <h3>{commercialContent.aboutTitle}</h3>
                <p>{commercialContent.aboutText}</p>
              </section>
              <section className="media-kit-metrics">
                <span>02 / COMUNIDADE</span>
                <div>
                  {communityMetrics.slice(0, 4).map((metric) => (
                    <article key={metric.metric_key}>
                      <small>{metric.label}</small>
                      <b>{metric.value}</b>
                      <em>{metric.helper_text}</em>
                    </article>
                  ))}
                </div>
              </section>
              <section className="media-kit-formats">
                <span>03 / FORMATOS COMERCIAIS</span>
                <div>
                  {commercialContent.formats.map((format) => (
                    <article key={format.title}>
                      <b>{format.title}</b>
                      <p>{format.description}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="media-kit-difference">
                <span>04 / DIFERENCIAL</span>
                <div>
                  <h3>
                    {differenceLead}.<br />
                    <em>{differenceAccentParts.join(". ")}</em>
                  </h3>
                  <p>{commercialContent.differenceText}</p>
                </div>
              </section>
              <section className="media-kit-actions">
                <div>
                  <small>CONTATO COMERCIAL</small>
                  <a href={`mailto:${officialLinks.email}`}>{officialLinks.email.toUpperCase()}</a>
                </div>
                <button className="button secondary" type="button" onClick={() => window.print()}>
                  IMPRIMIR / SALVAR PDF <span>↓</span>
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => {
                    setMediaKitOpen(false);
                    setContactOpen(true);
                    setContactStatus("idle");
                  }}
                >
                  SOLICITAR PROPOSTA <span>↗</span>
                </button>
              </section>
              <p className="media-kit-note">CONTEÚDO E MÉTRICAS GERENCIADOS PELO THENEES CONTROL · FONTES AUTOMÁTICAS SERÃO ATIVADAS COM TWITCH E KICK.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
