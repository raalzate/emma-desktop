import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppProviders } from "@/interface/app-providers";

/**
 * Tipografías del rediseño «Café sereno» (issue #146):
 * display → titulares/wordmark, body → texto corrido, mono → código.
 * Las fuentes viven en el repo (`src/app/fonts`, subconjunto latino, licencia
 * OFL): el cargador de Google Fonts las descargaba en el build y en CI se caía sin
 * cambio de código (incidente 2026-11-25). Bricolage e Instrument son
 * variables (un archivo para todos los pesos). `display: "swap"` + fallbacks
 * del sistema evitan bloqueo.
 */
const fontDisplay = localFont({
  src: [{ path: "./fonts/bricolage-grotesque-latin.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});

const fontBody = localFont({
  src: [{ path: "./fonts/instrument-sans-latin.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-body",
  display: "swap",
});

const fontMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500-latin.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EMMA — English for Modern Minds in Action",
  description: "Local-first conversational English tutor for IT professionals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
      <head>
        {/* Aplica `.dark` antes del primer pintado (evita el flash de tema claro).
            Espeja src/lib/theme.ts (THEME_STORAGE = "emma_theme"). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("emma_theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
