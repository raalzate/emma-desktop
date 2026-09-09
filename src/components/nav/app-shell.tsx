"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Target, BarChart3, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandWordmark } from "./brand-wordmark";

/**
 * Shell persistente del rediseño «Café sereno»: sidebar fija con wordmark,
 * navegación principal, una ranura opcional (`extra`, p. ej. sesiones de chat)
 * y el sello local-first. El contenido de la página va en `children`.
 */
const NAV_ITEMS = [
  { href: "/", label: "Tu ruta", icon: MapPin },
  { href: "/practice", label: "Práctica", icon: Target },
  { href: "/progress", label: "Progreso", icon: BarChart3 },
  { href: "/settings", label: "Ajustes", icon: Settings },
] as const;

function esActivo(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/chat");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ extra, children }: { extra?: ReactNode; children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="flex h-screen w-full bg-background">
      <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-card p-5">
        <BrandWordmark className="text-2xl" />
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
                esActivo(pathname, href)
                  ? "bg-primary-soft text-primary-deep"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        {extra ? <div className="min-h-0 flex-1 overflow-y-auto">{extra}</div> : null}
        <div className={cn("flex items-center gap-2 rounded-[10px] bg-background px-3 py-2.5", extra ? "" : "mt-auto")}>
          <ShieldCheck className="h-4 w-4 shrink-0 text-scaffold-easy" aria-hidden />
          <span className="font-code text-[10px] uppercase tracking-wide text-muted-foreground">
            100% local · tus datos en tu equipo
          </span>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
