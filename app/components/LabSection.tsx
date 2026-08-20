interface LabSectionProps {
  siteContent: any;
}

export function LabSection({ siteContent }: LabSectionProps) {
  return (
    <section className="lab" id="lab">
      <div className="lab-copy">
        <div className="section-tag">
          <span>06</span>
          <b>THENEES LAB</b>
        </div>
        <p className="kicker">
          EXPERIMENTOS EM ANDAMENTO <i />
        </p>
        <h2>
          COISAS QUE<br />
          TALVEZ <span>FUNCIONEM.</span>
        </h2>
        <p>{siteContent.labText}</p>
        <a className="button primary" href="#control">
          EXPLORAR O LAB <span>→</span>
        </a>
      </div>
      <div className="lab-terminal">
        <div className="terminal-bar">
          <span>THENEES_LAB.EXE</span>
          <div className="lab-signal">
            <b>● LAB ONLINE</b>
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="terminal-body lab-board">
          <div className="lab-board-head">
            <div>
              <span>PAINEL DE EXPERIMENTOS</span>
              <strong>3 PROJETOS EM TESTE</strong>
            </div>
            <small>BUILD 0.6.2 / COMUNIDADE</small>
          </div>
          <div className="lab-projects">
            <article className="lab-project active">
              <span>01</span>
              <div>
                <small>GAME + CHAT</small>
                <strong>CHATBATTLE</strong>
                <p>Comandos da comunidade viram ações dentro do jogo.</p>
              </div>
              <aside>
                <b>EM CONSTRUÇÃO</b>
                <i><em style={{ width: "72%" }} /></i>
                <small>72%</small>
              </aside>
            </article>
            <article className="lab-project">
              <span>02</span>
              <div>
                <small>FERRAMENTA</small>
                <strong>NEESBOT</strong>
                <p>Eventos, quotes, novos players e aniversários na Twitch e Kick.</p>
              </div>
              <aside>
                <b>PROTÓTIPO</b>
                <i><em style={{ width: "46%" }} /></i>
                <small>46%</small>
              </aside>
            </article>
            <article className="lab-project">
              <span>03</span>
              <div>
                <small>UTILIDADE</small>
                <strong>LINKS DO CHAT</strong>
                <p>Links curtos, rastreáveis e controlados pelo painel.</p>
              </div>
              <aside>
                <b>EM TESTE</b>
                <i><em style={{ width: "28%" }} /></i>
                <small>28%</small>
              </aside>
            </article>
          </div>
          <div className="lab-log">
            <span>ÚLTIMO EVENTO</span>
            <p>
              <b>NEESBOT:</b> nova ideia detectada. chance de funcionar: <em>63%</em>
              <i className="cursor">_</i>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
