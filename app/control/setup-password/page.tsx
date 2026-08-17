"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SetupPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("VALIDANDO LINK SEGURO...");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      setMessage(data.session ? "LINK VALIDADO. DEFINA SUA NOVA SENHA." : "LINK INVÁLIDO OU EXPIRADO. SOLICITE UM NOVO LINK NO CONTROL.");
    });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 10) {
      setMessage("USE UMA SENHA COM PELO MENOS 10 CARACTERES.");
      return;
    }
    if (password !== confirmation) {
      setMessage("AS SENHAS NÃO COINCIDEM.");
      return;
    }
    setMessage("SALVANDO NOVA SENHA...");
    const { error } = await getSupabaseBrowserClient().auth.updateUser({ password });
    if (error) {
      setMessage("NÃO FOI POSSÍVEL SALVAR. SOLICITE UM NOVO LINK.");
      return;
    }
    setCompleted(true);
    setMessage("SENHA CRIADA. O THENEES CONTROL ESTÁ LIBERADO.");
  };

  return <main className="control-auth control-password-page">
    <section className="control-login" aria-labelledby="password-title">
      <div className="control-login-brand">THENEES<span>°</span> CONTROL</div>
      <div className="control-login-status"><i /> CONFIGURAÇÃO DE ACESSO</div>
      <h1 id="password-title">NOVA<br /><em>SENHA.</em></h1>
      <p>{message}</p>
      {ready && !completed && <form onSubmit={handleSubmit}>
        <label>NOVA SENHA<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={10} required /></label>
        <label>CONFIRMAR SENHA<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={10} required /></label>
        <button type="submit">SALVAR SENHA →</button>
      </form>}
      <a href="/control">← VOLTAR PARA O LOGIN</a>
    </section>
    <aside className="control-login-visual" aria-hidden="true"><span>AUTH_01</span><b>SECURE<br />ACCESS<br /><em>READY.</em></b><div>DATABASE <i /> READY</div><div>IDENTITY <i /> VERIFIED</div><div>CONTROL <i /> LOCKED</div></aside>
  </main>;
}
