"use client";

/**
 * Vista presentacional del almacenamiento de audio (FR-020, FR-021): conteo y
 * megas, borrar un clip, una conversación o todo (con confirmación) y tope configurable.
 */
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, Play, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AudioClipMeta } from "@/domain/audio/audio-clip";
import type { AudioUsage } from "@/domain/audio/i-audio-store";
import {
  clipsInGroup, formatClipDate, formatCap, formatDuration, formatSize, groupKey, originLabel,
  type ConversationGroup,
} from "./audio-storage-model";

export interface AudioStorageViewProps {
  usage: AudioUsage;
  groups: ConversationGroup[];
  /** Todos los clips; cada grupo muestra los suyos al expandirse. */
  clips: readonly AudioClipMeta[];
  expandedKeys: readonly string[];
  playingId: string | null;
  onToggleGroup: (key: string) => void;
  onPlayClip: (id: string) => void;
  onRemoveClip: (id: string) => void;
  /** Tope guardado (no el borrador del campo). */
  capBytes: number;
  capInput: string;
  capError: string | null;
  busy: boolean;
  onCapInput: (value: string) => void;
  onSaveCap: () => void;
  onRemoveConversation: (conversationId: string | null) => void;
  onRemoveAll: () => void;
}

const plural = (n: number) => `${n} ${n === 1 ? "clip" : "clips"}`;

/** El disparador entra como hijo: así el tooltip en español queda en un `title=` literal. */
function ConfirmDelete({ title, body, onConfirm, children }: {
  title: string; body: string; onConfirm: () => void; children: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel title="Cierra el aviso sin borrar nada.">Cancel</AlertDialogCancel>
          <AlertDialogAction title="Confirma y borra; no se puede deshacer." onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ClipRow({ clip, playing, busy, onPlay, onRemove }: {
  clip: AudioClipMeta; playing: boolean; busy: boolean; onPlay: () => void; onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-2">
      <div className="min-w-0">
        <p className="truncate text-sm">{clip.text || "(no text)"}</p>
        <p className="text-xs text-muted-foreground">
          {originLabel(clip.origin)} · {formatDuration(clip.durationMs)} · {formatSize(clip.bytes)} · {formatClipDate(clip.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        {playing ? (
          <Button variant="outline" size="sm" aria-label="Stop clip" title="Detiene la reproducción de este clip." onClick={onPlay}>
            <Square className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="outline" size="sm" aria-label="Play clip" title="Escucha este clip." onClick={onPlay}>
            <Play className="h-4 w-4" aria-hidden />
          </Button>
        )}
        <ConfirmDelete
          title="Delete this clip?"
          body="The recording is removed from this device. Its review card keeps the text."
          onConfirm={onRemove}
        >
          <Button variant="destructive" size="sm" aria-label="Delete clip" title="Borra este clip; esta acción no se puede deshacer." disabled={busy}>
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </ConfirmDelete>
      </div>
    </li>
  );
}

export function AudioStorageView(p: AudioStorageViewProps) {
  const empty = p.usage.count === 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved audio</CardTitle>
        <CardDescription>
          {empty
            ? "No saved audio yet. Your voice notes and key phrases will show up here."
            : `${plural(p.usage.count)} · ${formatSize(p.usage.bytes)} of ${formatCap(p.capBytes)} on this device.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {p.groups.map((g) => {
          const key = groupKey(g.conversationId);
          const open = p.expandedKeys.includes(key);
          const listId = `audio-group-${key}`;
          const Chevron = open ? ChevronDown : ChevronRight;
          return (
            <div key={key} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button" aria-expanded={open} aria-controls={listId}
                  title="Muestra u oculta los clips de este grupo."
                  className="flex min-w-0 items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => p.onToggleGroup(key)}
                >
                  <Chevron className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {g.conversationId ? `Conversation ${g.conversationId.slice(0, 8)}` : "Practice attempts"}
                    </span>
                    <span className="block text-xs text-muted-foreground">{plural(g.count)} · {formatSize(g.bytes)}</span>
                  </span>
                </button>
                <ConfirmDelete
                  title="Delete these clips?"
                  body="The recordings are removed from this device. Review cards keep their text."
                  onConfirm={() => p.onRemoveConversation(g.conversationId)}
                >
                  <Button variant="destructive" size="sm" className="shrink-0 gap-1" title="Borra los clips de este grupo; esta acción no se puede deshacer." disabled={p.busy}>
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete
                  </Button>
                </ConfirmDelete>
              </div>
              {open && (
                <ul id={listId} className="space-y-1">
                  {clipsInGroup(p.clips, g.conversationId).map((c) => (
                    <ClipRow
                      key={c.id} clip={c} playing={p.playingId === c.id} busy={p.busy}
                      onPlay={() => p.onPlayClip(c.id)} onRemove={() => p.onRemoveClip(c.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        <div className="space-y-2">
          <label htmlFor="audio-cap" className="text-sm font-medium">Storage limit (MB)</label>
          <div className="flex items-center gap-2">
            <Input
              id="audio-cap" inputMode="numeric" className="w-32" value={p.capInput}
              aria-invalid={p.capError !== null}
              title="Espacio máximo para el audio guardado; mínimo 50 MB."
              onChange={(e) => p.onCapInput(e.target.value)}
            />
            <Button variant="outline" size="sm" title="Guarda el nuevo límite de espacio para el audio." disabled={p.busy} onClick={p.onSaveCap}>
              Save limit
            </Button>
          </div>
          {p.capError && <p role="alert" className="text-sm text-destructive">{p.capError}</p>}
        </div>
        {!empty && (
          <ConfirmDelete
            title="Delete all saved audio?"
            body="Every recording is removed from this device. Review cards keep their text."
            onConfirm={p.onRemoveAll}
          >
            <Button variant="destructive" size="sm" className="gap-1" title="Borra todo el audio guardado; esta acción no se puede deshacer." disabled={p.busy}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete all audio
            </Button>
          </ConfirmDelete>
        )}
      </CardContent>
    </Card>
  );
}
