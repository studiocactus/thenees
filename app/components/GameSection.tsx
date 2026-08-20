import { useState, useEffect } from "react";
import { chatBattleSequence, gameSettings, adminLiveEventEffectsPreview } from "../constants";

interface GameSectionProps {
  siteContent: any;
}

export function GameSection({ siteContent }: GameSectionProps) {
  const [gameMode, setGameMode] = useState<"live" | "profile">("live");
  const [selectedLiveEvent, setSelectedLiveEvent] = useState<keyof typeof adminLiveEventEffectsPreview>("follow");
  const [chatStep, setChatStep] = useState(1);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setChatStep(chatBattleSequence.length);
      return;
    }
    const timer = window.setInterval(() => {
      setChatStep((current) => current >= chatBattleSequence.length + 2 ? 1 : current + 1);
    }, 1650);
    return () => window.clearInterval(timer);
  }, []);

  const communityPower = Math.min(96, 42 + chatStep * 6);
  const creaturePower = Math.max(12, 58 - chatStep * 5);

  return (
    <section className="game-section" id="game">
      <div className="section-tag">
        <span>03</span>
        <b>O GAME</b>
      </div>
      <div className="game-layout">
        <div>
          <p className="kicker">
            EM DESENVOLVIMENTO <i />
          </p>
          <h2>
            NA LIVE, VOCÊ JOGA.<br />
            <span>NO OFF, VOCÊ EVOLUI.</span>
          </h2>
        </div>
        <div className="game-copy">
          <p>{siteContent.gameText}</p>
          <a className="button ink" href="/jogar">
            ACESSAR {gameSettings.name.toUpperCase()} <span>↗</span>
          </a>
        </div>
      </div>
      <div className="mode-switch" role="group" aria-label="Conheça os modos do game">
        <button className={gameMode === "live" ? "active" : ""} onClick={() => setGameMode("live")}>
          <span>01</span> DURANTE A LIVE
        </button>
        <button className={gameMode === "profile" ? "active" : ""} onClick={() => setGameMode("profile")}>
          <span>02</span> QUANDO ESTIVER OFF
        </button>
      </div>
      <div className="game-demo">
        {gameMode === "live" ? (
          <div className="chat-mode">
            <div className="demo-copy">
              <span className="demo-label">
                <i /> LIVE MODE
              </span>
              <h3>O CHAT É O<br />CONTROLE.</h3>
              <p>Comandos, follows, subs, bits e donates podem ativar batalhas, buffs, itens e eventos coletivos sem ninguém sair da transmissão.</p>
              <div className="live-events" aria-label="Eventos que afetam o game">
                {Object.entries(adminLiveEventEffectsPreview).map(([key, event]) => (
                  <button
                    type="button"
                    className={selectedLiveEvent === key ? "active" : ""}
                    aria-pressed={selectedLiveEvent === key}
                    key={key}
                    onClick={() => setSelectedLiveEvent(key as keyof typeof adminLiveEventEffectsPreview)}
                  >
                    {event.label}
                  </button>
                ))}
              </div>
              <div className="event-explanation" aria-live="polite">
                <small>EFEITO / {adminLiveEventEffectsPreview[selectedLiveEvent].label}</small>
                <strong>{adminLiveEventEffectsPreview[selectedLiveEvent].title}</strong>
                <p>{adminLiveEventEffectsPreview[selectedLiveEvent].effect}</p>
                <em>CONTEÚDO EDITÁVEL NO ADMIN</em>
              </div>
              <div className="community-rule">
                <small>REGRA_01 / SEM PAY-TO-WIN</small>
                <strong>A COMUNIDADE<br />SEMPRE GANHA.</strong>
                <p>O apoio muda o caminho e aumenta o caos — nunca compra a vitória de uma pessoa sobre as outras.</p>
              </div>
              <div className="command-list">
                <code>!atacar</code>
                <code>!defender</code>
                <code>!inventário</code>
                <code>!grupo</code>
              </div>
            </div>
            <div className="chat-window">
              <div className="demo-bar">
                <b>CHAT / RAID_042</b>
                <span>● 142 ONLINE</span>
              </div>
              <div className="chat-lines">
                <div className="animated-chat" aria-live="polite">
                  {chatBattleSequence.slice(0, Math.min(chatStep, chatBattleSequence.length)).map((message, index) => (
                    <p className={`chat-message ${message.type}`} key={`${message.name}-${index}`}>
                      <b className={message.type === "bot" ? "lime-name" : ""}>{message.name}</b>
                      <span>{message.text}</span>
                    </p>
                  ))}
                  {chatStep < chatBattleSequence.length && (
                    <div className="bot-typing">
                      <i />
                      <i />
                      <i />
                      <span>NEESBOT PROCESSANDO EVENTO</span>
                    </div>
                  )}
                </div>
                <div className="battle-status">
                  <div className="meter-row">
                    <span>COMUNIDADE</span>
                    <i><em style={{ width: `${communityPower}%` }} /></i>
                    <strong>{communityPower}%</strong>
                  </div>
                  <div className="meter-row creature">
                    <span>CRIATURA</span>
                    <i><em style={{ width: `${creaturePower}%` }} /></i>
                    <strong>{creaturePower}%</strong>
                  </div>
                </div>
                <div className="chat-input">
                  ENVIAR UMA MENSAGEM <span>↵</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-mode">
            <div className="demo-copy">
              <span className="demo-label">◫ OFFLINE MODE</span>
              <h3>SEU BONECO<br />CONTINUA VIVO.</h3>
              <p>Entre no site quando quiser para acompanhar o personagem, equipar itens, ver conquistas e se preparar para a próxima live.</p>
              <div className="profile-actions">
                <span>PERFIL</span>
                <span>INVENTÁRIO</span>
                <span>CONQUISTAS</span>
                <span>RANKING</span>
              </div>
            </div>
            <div className="character-card">
              <div className="demo-bar">
                <b>MEU PERSONAGEM</b>
                <span>ÚLTIMO SAVE: 02H</span>
              </div>
              <div className="character-content">
                <div className="mini-avatar">
                  <span className="mini-eye left" />
                  <span className="mini-eye right" />
                  <i />
                </div>
                <div className="char-title">
                  <small>PLAYER #0142</small>
                  <h4>CAOSMAGO</h4>
                  <span>LVL 28 / CLASSE: IMPROVISADOR</span>
                </div>
                <div className="xp">
                  <span>XP PARA O PRÓXIMO NÍVEL</span>
                  <b>████████░░ 8.410 / 10.000</b>
                </div>
                <div className="inventory">
                  <span>ITENS EQUIPADOS</span>
                  <div>
                    <i>⚔</i>
                    <i>⬡</i>
                    <i>✦</i>
                    <i>?</i>
                  </div>
                </div>
                <div className="char-stats">
                  <span>VITÓRIAS <b>18</b></span>
                  <span>CAOS CAUSADO <b>92%</b></span>
                  <span>RANK <b>#42</b></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="feature-grid">
        <article>
          <b>01</b>
          <div className="feature-icon pixel-chat" aria-hidden="true">
            <i /><i /><i />
          </div>
          <h3>JOGUE PELO CHAT</h3>
          <p>Comandos simples viram ações dentro do game durante a live.</p>
        </article>
        <article>
          <b>02</b>
          <div className="feature-icon pixel-player" aria-hidden="true">
            <i /><i />
          </div>
          <h3>UM BONECO SÓ SEU</h3>
          <p>Seu personagem mantém nível, itens e história entre as transmissões.</p>
        </article>
        <article>
          <b>03</b>
          <div className="feature-icon pixel-level" aria-hidden="true">
            <i /><i /><i />
            <span>XP</span>
          </div>
          <h3>EVOLUÇÃO CONTÍNUA</h3>
          <p>Acesse seu perfil no off e prepare-se para a próxima aventura.</p>
        </article>
      </div>
    </section>
  );
}
