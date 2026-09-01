"use client";

/**
 * Sección «SESIONES» de la sidebar del shell (rediseño «Café sereno»): lista
 * de conversaciones (simulaciones) con la activa resaltada, botón de nuevo
 * chat y acciones por ítem (renombrar, eliminar). Ya no es una barra propia:
 * ChatView la inyecta por la ranura `extra` del AppShell — una sola sidebar.
 */

import { useState } from "react";
import { Check, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/domain/chat/chat-conversation";

interface Props {
  list: ChatConversation[];
  activeId: string | null;
  onNew: () => void;
  onOpen: (c: ChatConversation) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function ChatSidebar({ list, activeId, onNew, onOpen, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (c: ChatConversation) => {
    setEditing(c.id);
    setDraft(c.title);
  };
  const commit = (id: string) => {
    const t = draft.trim();
    if (t) onRename(id, t);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-1 pt-2">
      <div className="flex items-center justify-between px-1 pb-1">
        <p className="font-code text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          SESIONES
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onNew}
          aria-label="Nuevo chat"
          title="Nuevo chat"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {list.length === 0 && (
        <p className="px-2 py-3 text-xs text-muted-foreground">
          Aún no tienes chats. Empieza uno nuevo.
        </p>
      )}
      {list.map((c) => (
        <div
          key={c.id}
          className={cn(
            "group flex items-center gap-1 rounded-[10px] border px-2.5 py-2 text-sm transition-colors",
            activeId === c.id
              ? "border-border bg-secondary"
              : "border-transparent hover:bg-secondary/60",
          )}
        >
          {editing === c.id ? (
            <>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commit(c.id)}
                autoFocus
                className="h-7 flex-1 text-sm"
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => commit(c.id)} aria-label="Guardar">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(null)} aria-label="Cancelar">
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <button className="min-w-0 flex-1 truncate text-left" onClick={() => onOpen(c)} title={c.title}>
                {c.title}
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                onClick={() => startEdit(c)}
                aria-label="Renombrar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                onClick={() => void onDelete(c.id)}
                aria-label="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
