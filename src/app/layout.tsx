import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/interface/app-providers";

/**
 * Tipografías del rediseño «Café sereno» (issue #146):
 * display → titulares/wordmark, body → texto corrido, mono → código.
 * next/font/google descarga y auto-hospeda en build (compatible con
 * `next export`); `display: "swap"` + fallbacks del sistema evitan bloqueo
 * si la fuente tarda o falta.
 */
const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EMMA — English for Modern Minds in Action",
  description: "Tutora de inglés conversacional local-first para profesionales de TI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
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
