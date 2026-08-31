"use client";

/**
 * Barra lateral del historial: lista de conversaciones (simulaciones) con la
 * activa resaltada, botón de nuevo chat y acciones por ítem (renombrar, eliminar).
 */

import { useState } from "react";
import { Check, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-muted/30">
      <div className="p-3">
        <Button onClick={onNew} className="w-full justify-start gap-2" variant="secondary">
          <MessageSquarePlus className="h-4 w-4" />
          Nuevo chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 px-2 pb-3">
          {list.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted-foreground">
              Aún no tienes chats. Empieza uno nuevo.
            </p>
          )}
          {list.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                activeId === c.id && "bg-accent",
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
      </ScrollArea>
    </aside>
  );
}
