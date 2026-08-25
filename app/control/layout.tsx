import type { Metadata } from "next";
import "./control.css";
import "./admin-navigation.css";
import "./counter-panel.css";
import "./special-viewer-feedback.css";
import "./bot-overview.css";
import "./moderator-command-center.css";
import "./number-inputs.css";
import "./notifications.css";

export const metadata: Metadata = {
  title: "Thenees Control — Acesso restrito",
  description: "Painel administrativo do ecossistema Thenees.",
};

export default function ControlLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
