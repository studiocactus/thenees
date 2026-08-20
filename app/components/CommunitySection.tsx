import { useState, useEffect } from "react";
import type { PublicCommunityMetric, PublicCommunityQuote } from "../types";

interface CommunitySectionProps {
  siteContent: any;
  officialLinks: any;
  communityMetrics: PublicCommunityMetric[];
  communityQuotes: PublicCommunityQuote[];
}

export function CommunitySection({
  siteContent,
  officialLinks,
  communityMetrics,
  communityQuotes,
}: CommunitySectionProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setQuoteIndex((current) => (current + 1) % Math.max(communityQuotes.length, 1)), 5200);
    return () => window.clearInterval(timer);
  }, [communityQuotes.length]);

  return (
    <section className="community-section" id="comunidade">
      <div className="community-intro">
        <div className="section-tag">
          <span>04</span>
          <b>COMUNIDADE</b>
        </div>
        <h2>NINGUÉM JOGA<br />SOZINHO.</h2>
        <p>{siteContent.communityText}</p>
        <a className="button primary" href={officialLinks.discordUrl} target="_blank" rel="noreferrer">
          ENTRAR NO DISCORD <span>↗</span>
        </a>
      </div>
      <div className="community-stats">
        {communityMetrics.slice(0, 4).map((metric) => (
          <div key={metric.metric_key}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.helper_text}</small>
          </div>
        ))}
        <div className="quote-wall">
          <div className="quote-head">
            <span>!QUOTE / ARQUIVO DA COMUNIDADE</span>
            <small>{String(quoteIndex + 1).padStart(2, "0")} / {String(communityQuotes.length).padStart(2, "0")}</small>
          </div>
          <blockquote key={quoteIndex}>“{communityQuotes[quoteIndex]?.quote_text}”</blockquote>
          <div className="quote-meta">
            <strong>— {communityQuotes[quoteIndex]?.author_name}</strong>
            <span>
              {communityQuotes[quoteIndex]?.platform} ·{" "}
              {communityQuotes[quoteIndex]?.quoted_at
                ? new Date(communityQuotes[quoteIndex].quoted_at).toLocaleDateString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })
                : ""}
            </span>
          </div>
          <div className="quote-progress">
            {communityQuotes.map((quote, index) => (
              <i className={quoteIndex === index ? "active" : ""} key={quote.id} />
            ))}
          </div>
          <div className="quote-bot-confirm">
            <span>NEESBOT / RESPOSTA NO CHAT</span>
            <p>
              @{communityQuotes[quoteIndex]?.author_name}, sua frase entrou para o arquivo da comunidade! Veja em <b>{officialLinks.communityUrl}</b>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
