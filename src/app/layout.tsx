import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/interface/app-providers";

export const metadata: Metadata = {
  title: "EMMA — English for Modern Minds in Action",
  description: "Tutora de inglés conversacional local-first para profesionales de TI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
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
