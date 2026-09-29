"use client";

/**
 * Cabecera de página secundaria con botón de vuelta. Por defecto vuelve a la
 * ruta (home); las subpáginas de Práctica vuelven a /practice.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PageHeaderBack {
  href: string;
  label: string;
}

const HOME: PageHeaderBack = { href: "/", label: "Back to your path" };

export function PageHeader({ title, back = HOME }: { title: string; back?: PageHeaderBack }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground"
        title={back.href === "/practice" ? "Vuelve a Práctica: tus lecciones y el plan de hoy" : "Vuelve a tu ruta de aprendizaje"}
      >
        <Link href={back.href} aria-label={back.label}>
          <ArrowLeft className="h-4 w-4" />
          {back.label}
        </Link>
      </Button>
      <h1 className="font-headline text-lg font-semibold text-foreground">{title}</h1>
    </header>
  );
}
