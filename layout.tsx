import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Studio Melk — Manager Next",
  description: "CRM e operação do Studio Melk",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
