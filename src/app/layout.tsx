import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Programacion RM — Radiologia",
  description: "Interpretacion automatica de valoraciones de RM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
