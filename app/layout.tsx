import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thenees — Community Operating System",
  description: "Twitch, Kick, games e comunidade. Um lugar onde assistir à live é só o começo.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
