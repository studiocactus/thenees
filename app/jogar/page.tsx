"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Player = {
  id: string;
  username: string;
  display_name: string | null;
  platform: "TWITCH" | "KICK" | "SITE";
  category: string | null;
  level: number;
  birthday: string | null;
  birthday_public:boolean;
  birthday_party_enabled:boolean;
};

const categories = ["AVENTUREIRO", "ESTRATEGISTA", "GUARDIÃO", "AGENTE DO CAOS"];

export default function PlayerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [birthday, setBirthday] = useState("");
  const [birthdayPublic,setBirthdayPublic]=useState(true);
  const [birthdayPartyEnabled,setBirthdayPartyEnabled]=useState(true);
  const [platform, setPlatform] = useState<Player["platform"]>("SITE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPlayer = async (currentUser: User) => {
    const { data } = await getSupabaseBrowserClient().from("game_players").select("id,username,display_name,platform,category,level,birthday,birthday_public,birthday_party_enabled").eq("auth_user_id", currentUser.id).maybeSingle();
    const current = data as Player | null;
    setPlayer(current);
    if (current) {
      setUsername(current.username);
      setDisplayName(current.display_name ?? "");
      setCategory(current.category ?? categories[0]);
      setBirthday(current.birthday ?? "");
      setBirthdayPublic(current.birthday_public);
      setBirthdayPartyEnabled(current.birthday_party_enabled);
      setPlatform(current.platform);
      await getSupabaseBrowserClient().from("game_presence").upsert({ player_id: current.id, status: "online", platform: current.platform, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) void loadPlayer(data.user); else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void loadPlayer(session.user); else { setPlayer(null); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/jogar` } });
      if (error) setMessage(error.message.includes("registered") ? "Este e-mail já possui uma conta." : "Não foi possível criar a conta. Confira os dados.");
      else if (!data.session) setMessage("Conta criada! Confirme o link enviado ao seu e-mail para entrar no game.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("E-mail ou senha inválidos.");
    }
    setPassword("");
    setSaving(false);
  };

  const handleProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");
    const payload = { auth_user_id: user.id, username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""), display_name: displayName.trim() || null, category, birthday: birthday || null,birthday_public:birthdayPublic,birthday_party_enabled:birthdayPartyEnabled, platform, active: true, updated_at: new Date().toISOString() };
    const query = player
      ? getSupabaseBrowserClient().from("game_players").update(payload).eq("id", player.id).select("id,username,display_name,platform,category,level,birthday,birthday_public,birthday_party_enabled").single()
      : getSupabaseBrowserClient().from("game_players").insert(payload).select("id,username,display_name,platform,category,level,birthday,birthday_public,birthday_party_enabled").single();
    const { data, error } = await query;
    if (error) setMessage(error.code === "23505" ? "Esse nome de jogador já está em uso." : "Não foi possível salvar seu personagem.");
    else {
      const saved = data as Player;
      setPlayer(saved);
      await getSupabaseBrowserClient().from("game_presence").upsert({ player_id: saved.id, status: "online", platform: saved.platform, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      setMessage("PERSONAGEM SALVO. VOCÊ ESTÁ PRONTO PARA A PRÓXIMA LIVE.");
    }
    setSaving(false);
  };

  const signOut = async () => {
    if (player) await getSupabaseBrowserClient().from("game_presence").update({ status: "offline", updated_at: new Date().toISOString() }).eq("player_id", player.id);
    await getSupabaseBrowserClient().auth.signOut();
  };

  if (loading) return <main className="player-shell"><div className="player-loading">CARREGANDO PERSONAGEM...</div></main>;

  return <main className="player-shell">
    <header className="player-topbar"><a href="/">THENEES<span>°</span></a><div><i /> CHATBATTLE / {user ? "JOGADOR CONECTADO" : "ACESSO AO GAME"}</div>{user ? <button type="button" onClick={signOut}>SAIR</button> : <a href="/#game">← VOLTAR AO SITE</a>}</header>
    <section className="player-layout">
      <aside className="player-intro"><small>PLAYER_PROFILE.EXE</small><h1>SEU BONECO.<br /><em>SEU CAOS.</em></h1><p>Crie sua identidade no ChatBattle. Durante a live, o chat controla a aventura. No off, você acompanha tudo o que conquistou.</p><div className="player-system"><span><i /> PERFIL PERSISTENTE</span><span><i /> PROGRESSO ENTRE LIVES</span><span className="pending"><i /> TWITCH + KICK EM BREVE</span></div></aside>
      <section className="player-panel">
        {!user ? <>
          <div className="player-panel-heading"><span>AUTH_GATE / 01</span><b>{mode === "register" ? "CRIAR CONTA" : "ENTRAR NO GAME"}</b></div>
          <div className="player-tabs"><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }} type="button">NOVO JOGADOR</button><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }} type="button">JÁ TENHO CONTA</button></div>
          <form className="player-form auth" onSubmit={handleAuth}><label>E-MAIL<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="VOCE@EMAIL.COM" /></label><label>SENHA<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder="MÍNIMO 8 CARACTERES" /></label>{message && <p className="player-message">{message}</p>}<button className="player-primary" disabled={saving} type="submit">{saving ? "PROCESSANDO..." : mode === "register" ? "CRIAR MEU JOGADOR →" : "ENTRAR →"}</button></form>
        </> : <>
          <div className="player-panel-heading"><span>PLAYER_SLOT / {player ? "ATIVO" : "VAZIO"}</span><b>{player ? `LV.${String(player.level).padStart(2,"0")} / ${player.username}` : "CRIAR PERSONAGEM"}</b></div>
          <form className="player-form profile" onSubmit={handleProfile}><label>NOME DE JOGADOR<input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" placeholder="SEM ESPAÇOS" /></label><label>NOME EXIBIDO<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} placeholder="COMO A COMUNIDADE TE CHAMA" /></label><label>CLASSE INICIAL<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>PLATAFORMA PRINCIPAL<select value={platform} onChange={(event) => setPlatform(event.target.value as Player["platform"])}><option value="SITE">SITE</option><option value="TWITCH">TWITCH</option><option value="KICK">KICK</option></select></label><label>ANIVERSÁRIO <small>OPCIONAL / MODO FESTA</small><input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} /></label><div className="player-birthday-options"><label><input type="checkbox" checked={birthdayPublic} onChange={(event)=>setBirthdayPublic(event.target.checked)} /> MOSTRAR MEU ANIVERSÁRIO PARA A COMUNIDADE</label><label><input type="checkbox" checked={birthdayPartyEnabled} onChange={(event)=>setBirthdayPartyEnabled(event.target.checked)} /> ATIVAR MODO FESTA E MENSAGEM DO NEESBOT</label></div>{message && <p className="player-message">{message}</p>}<button className="player-primary" disabled={saving} type="submit">{saving ? "SALVANDO..." : player ? "ATUALIZAR PERSONAGEM →" : "SALVAR PERSONAGEM →"}</button></form>
          <div className="player-connections"><header><b>CONEXÕES DO JOGADOR</b><span>ROADMAP</span></header><article><i /> TWITCH <b>AGUARDANDO INTEGRAÇÃO</b></article><article><i /> KICK <b>AGUARDANDO INTEGRAÇÃO</b></article></div>
        </>}
      </section>
    </section>
  </main>;
}
