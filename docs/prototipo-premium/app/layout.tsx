import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gênesis Atividades — Experiência Premium",
  description: "Crie, adapte e organize atividades pedagógicas para cada aluno.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
