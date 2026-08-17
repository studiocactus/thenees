import type { Metadata } from "next";
import "./player.css";
import "./readability.css";
import "./birthday.css";

export const metadata: Metadata = {
  title: "ChatBattle — Área do jogador",
  description: "Crie seu personagem, acompanhe sua evolução e prepare-se para a próxima live.",
};

export default function PlayerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
