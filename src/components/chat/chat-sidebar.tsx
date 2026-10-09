"use client";

/**
 * Sección «SESSIONS» de la sidebar del shell (rediseño «Café sereno»): lista
 * de conversaciones (simulaciones) con la activa resaltada, botón de nuevo
 * chat y acciones por ítem (renombrar, eliminar). Ya no es una barra propia:
 * ChatView la inyecta por la ranura `extra` del AppShell — una sola sidebar.
 */

import { useState } from "react";
import { Check, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { levelLabel, type CefrLevel } from "@/domain/cefr/cefr-ladder";
import { groupArchivedByLevel, type ChatConversation } from "@/domain/chat/chat-conversation";

/** Único lugar donde se rotula el nivel de un grupo archivado («Level N»). */
export function archivedGroupLabel(level: CefrLevel): string {
  return levelLabel(level);
}

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

  const renderRow =
    (c: ChatConversation) => (
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
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Guarda el nuevo nombre (Enter)" onClick={() => commit(c.id)} aria-label="Save">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Descarta el cambio y conserva el nombre anterior" onClick={() => setEditing(null)} aria-label="Cancel">
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary font-headline text-xs font-bold text-muted-foreground"
                aria-hidden
              >
                {c.title.trim().charAt(0).toUpperCase()}
              </span>
              <button className="min-w-0 flex-1 truncate text-left" title={"Retoma esta conversación: " + c.title} onClick={() => onOpen(c)}>
                {c.title}
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                title="Ponle un nombre que te ayude a encontrar esta conversación"
                onClick={() => startEdit(c)}
                aria-label="Rename"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                title="Borra esta conversación de forma permanente"
                onClick={() => void onDelete(c.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      );

  const active = list.filter((c) => !c.archived);
  const groups = groupArchivedByLevel(list);

  return (
    <div className="flex flex-col gap-1 pt-2">
      <div className="flex items-center justify-between px-1 pb-1">
        <p className="font-code text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          SESSIONS
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onNew}
          aria-label="New chat"
          title="Nuevo chat"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {list.length === 0 && (
        <p className="px-2 py-3 text-xs text-muted-foreground">
          No chats yet. Start a new one.
        </p>
      )}
      {active.map(renderRow)}
      {groups.length > 0 && (
        <details className="mt-2">
          <summary
            className="cursor-pointer px-1 py-1 font-code text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
            title="Conversaciones de niveles que ya superaste; se abren solo para leer"
          >
            Archived
          </summary>
          {groups.map((g) => (
            <div key={g.level} className="flex flex-col gap-1 pt-1">
              <p className="px-1 text-[10px] text-muted-foreground">{archivedGroupLabel(g.level)}</p>
              {g.conversations.map(renderRow)}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
