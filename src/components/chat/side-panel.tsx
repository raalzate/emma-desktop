"use client";

/**
 * Columna lateral junto al chat: el contenido de apoyo (Teach me) se lee al lado
 * de la conversación en vez de taparla con un modal. Cierra con la X o con Esc.
 */

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function SidePanel({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside className="flex h-full min-h-0 w-[26rem] shrink-0 flex-col overflow-hidden border-l bg-background duration-300 animate-in fade-in slide-in-from-right-8 xl:w-[34rem] 2xl:w-[40rem]">
      <header className="flex items-center justify-between gap-2 border-b px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">{title}</h2>
        <Button variant="ghost" size="icon" title="Cerrar el panel" aria-label="Close panel" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-5 py-4">{children}</div>
      </ScrollArea>
    </aside>
  );
}
