"use client";

/**
 * Vista presentacional del almacenamiento de audio (FR-020, FR-021): conteo y
 * megas, borrar por conversación o todo (con confirmación) y tope configurable.
 */
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AudioUsage } from "@/domain/audio/i-audio-store";
import { formatMb, type ConversationGroup } from "./audio-storage-model";

export interface AudioStorageViewProps {
  usage: AudioUsage;
  groups: ConversationGroup[];
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
            : `${plural(p.usage.count)} · ${formatMb(p.usage.bytes)} on this device.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {p.groups.map((g) => (
          <div key={g.conversationId ?? "other"} className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {g.conversationId ? `Conversation ${g.conversationId.slice(0, 8)}` : "Practice attempts"}
              </p>
              <p className="text-xs text-muted-foreground">{plural(g.count)} · {formatMb(g.bytes)}</p>
            </div>
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
        ))}
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
