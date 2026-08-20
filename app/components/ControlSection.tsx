export function ControlSection() {
  return (
    <section className="control" id="control">
      <div className="control-ui">
        <div className="control-nav">
          <b>
            THENEES° <span>CONTROL</span>
          </b>
          <i>● CONNECTED</i>
        </div>
        <div className="control-grid">
          <aside>
            <span>OVERVIEW</span>
            <span>LIVE CONTROL</span>
            <span>GAME MASTER</span>
            <span>LINKS</span>
            <span>BOT</span>
            <span>CONTENT</span>
          </aside>
          <div className="control-main">
            <small>GOOD EVENING, THENEES.</small>
            <h3>
              ALL SYSTEMS<br />
              <span>OPERATIONAL.</span>
            </h3>
            <div className="control-cards">
              <div>
                LIVE STATUS<strong>OFFLINE</strong>
              </div>
              <div>
                BOT STATUS<strong className="green">ONLINE</strong>
              </div>
              <div>
                ACTIVE LINKS<strong>24</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="control-copy">
        <div className="section-tag">
          <span>SYS</span>
          <b>EM BREVE / ACESSO RESTRITO</b>
        </div>
        <h2>
          THENEES<br />
          <span>CONTROL.</span>
        </h2>
        <p>O painel central para controlar o site, a live, o game, o bot e tudo que ainda nem inventamos.</p>
        <div className="locked">
          ▣ ADMIN ACCESS <b>LOCKED</b>
        </div>
      </div>
    </section>
  );
}
