"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ShortLinkRedirectPage() {
  const [status, setStatus] = useState("LOCALIZANDO LINK...");

  useEffect(() => {
    const slug = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() ?? "").toLowerCase();
    if (!isSupabaseConfigured || !slug) {
      setStatus("LINK INDISPONÍVEL.");
      return;
    }

    void getSupabaseBrowserClient()
      .from("short_links")
      .select("destination_url")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data?.destination_url) {
          setStatus("LINK NÃO ENCONTRADO OU DESATIVADO.");
          return;
        }
        setStatus("REDIRECIONANDO...");
        window.location.replace(data.destination_url);
      });
  }, []);

  return <main style={{minHeight:"100svh",display:"grid",placeItems:"center",background:"#0b0c0f",color:"#c5ff00",fontFamily:"monospace",letterSpacing:".12em",textAlign:"center",padding:"24px"}}><div><b>THENEES° / LINK</b><p style={{color:"#f4f4ef"}}>{status}</p><a href="/" style={{color:"#c5ff00"}}>VOLTAR AO SITE</a></div></main>;
}
