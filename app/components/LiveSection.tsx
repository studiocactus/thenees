import { useState } from "react";
import type { PublicFeaturedVideo, PublicScheduleEvent } from "../types";
import { getYouTubeId, formatScheduleDate } from "../lib/utils";

interface LiveSectionProps {
  featuredVideo: PublicFeaturedVideo;
  officialLinks: any; // We'll type this better if needed, for now any or just rely on what's passed
  birthdayMode: boolean;
  scheduleEvents: PublicScheduleEvent[];
  playerBirthday: boolean;
}

export function LiveSection({
  featuredVideo,
  officialLinks,
  birthdayMode,
  scheduleEvents,
  playerBirthday,
}: LiveSectionProps) {
  const [videoActive, setVideoActive] = useState(false);
  const [videoLinkCopied, setVideoLinkCopied] = useState(false);

  const featuredVideoId = getYouTubeId(featuredVideo.video_url);
  const featuredThumbnail =
    featuredVideo.thumbnail_url || (featuredVideoId ? `https://i.ytimg.com/vi/${featuredVideoId}/maxresdefault.jpg` : "");
  const nextLive = scheduleEvents[0];
  const followingLives = scheduleEvents.slice(1, 4);

  const copyFeaturedVideoLink = async () => {
    await navigator.clipboard.writeText(featuredVideo.video_url);
    setVideoLinkCopied(true);
    window.setTimeout(() => setVideoLinkCopied(false), 1800);
  };

  return (
    <section className="split-section" id="live">
      <div className="live-panel dark-panel">
        <div className="panel-top">
          <span>02 / VÍDEOS</span>
          <span className="video-managed">DESTAQUE EDITORIAL</span>
        </div>
        <div className="live-screen">
          {videoActive && featuredVideoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${featuredVideoId}?rel=0&autoplay=1`}
              title={featuredVideo.title}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="video-preview">
              {featuredThumbnail && (
                <img src={featuredThumbnail} alt={`Capa do vídeo ${featuredVideo.title}`} loading="lazy" />
              )}
              <button
                className="video-play"
                type="button"
                onClick={() => setVideoActive(true)}
                aria-label="Reproduzir vídeo"
              >
                ▶
              </button>
              <div className="video-preview-actions">
                <button type="button" onClick={copyFeaturedVideoLink}>
                  {videoLinkCopied ? "LINK COPIADO!" : "CLIQUE E COPIE O LINK"}
                </button>
                <a href={featuredVideo.video_url} target="_blank" rel="noreferrer">
                  ASSISTA NO YOUTUBE ↗
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="platforms">
          <a className="channel-link" href={officialLinks.youtubeUrl} target="_blank" rel="noreferrer">
            YOUTUBE / THENEES ↗
          </a>
        </div>
      </div>
      <div className="schedule-panel">
        <div className="panel-top">
          <span>AGENDA DE TRANSMISSÕES</span>
          <span>FUSO / BRT</span>
        </div>
        <div className={birthdayMode ? "schedule-summary birthday-mode" : "schedule-summary"}>
          <strong>
            {birthdayMode ? (playerBirthday ? "HOJE É SEU ANIVERSÁRIO" : "HOJE É MEU ANIVERSÁRIO") : "HOJE / BRASIL"}
          </strong>
          <span>
            {nextLive
              ? `PRÓXIMA LIVE · ${formatScheduleDate(nextLive.starts_at).date} · ${formatScheduleDate(nextLive.starts_at).hour}`
              : "AGENDA SENDO PREPARADA"}
          </span>
          {nextLive && (
            <div className="schedule-summary-details">
              <b>{nextLive.title}</b>
              <em>JOGO / {nextLive.game || "A DEFINIR"}</em>
            </div>
          )}
          <small>{birthdayMode ? "PARTY MODE" : nextLive?.platform ?? "SEM TRANSMISSÃO AGENDADA"}</small>
        </div>
        {followingLives.map((event, i) => {
          const formatted = formatScheduleDate(event.starts_at);
          const isOwnerBirthday = formatted.date === "12/08";
          return (
            <article className={isOwnerBirthday ? "schedule birthday-event" : "schedule"} key={event.id}>
              <span>
                {formatted.day}
                <small>{formatted.date}</small>
              </span>
              <b>{formatted.hour}</b>
              <div>
                <p>{isOwnerBirthday ? "LIVE DE ANIVERSÁRIO" : event.title}</p>
                <small>JOGO / {event.game || "A DEFINIR"}</small>
              </div>
              <em>{event.platform}</em>
              <i>{String(i + 1).padStart(2, "0")}</i>
            </article>
          );
        })}
        {!nextLive && <div className="schedule-empty">NENHUMA LIVE PUBLICADA NO MOMENTO.</div>}
        <div className="schedule-admin">
          <span>HORÁRIO · TÍTULO · JOGO · PLATAFORMA</span>
          <b>GERENCIADO NO THENEES CONTROL</b>
        </div>
        <p className="tiny-note">* Horários sujeitos a atualizações no painel, atrasos humanos e eventos aleatórios.</p>
      </div>
    </section>
  );
}
