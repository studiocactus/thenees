import type { Metadata } from "next";
import "./control.css";
import "./admin-navigation.css";

export const metadata: Metadata = {
  title: "Thenees Control — Acesso restrito",
  description: "Painel administrativo do ecossistema Thenees.",
};

export default function ControlLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
