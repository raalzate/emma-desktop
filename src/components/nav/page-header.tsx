"use client";

/** Cabecera de página secundaria con botón de vuelta a la ruta (home). */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground" title="Vuelve a tu ruta de aprendizaje">
        <Link href="/" aria-label="Back to your path">
          <ArrowLeft className="h-4 w-4" />
          Back to your path
        </Link>
      </Button>
      <h1 className="font-headline text-lg font-semibold text-foreground">{title}</h1>
    </header>
  );
}
