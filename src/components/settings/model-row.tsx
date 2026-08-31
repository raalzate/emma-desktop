"use client";

/** Fila de un modelo local: selección (radio), descarga con progreso, eliminar, revelar. */

import { useState } from "react";
import { CheckCircle2, Download, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LitertModelStatus } from "@/types/emma-api";

export interface ModelRowProps {
  model: LitertModelStatus;
  selected: boolean;
  recommended: boolean;
  progress?: number;
  onSelect: () => void;
  onDownload: () => Promise<unknown>;
  onDelete: () => void;
  onReveal: () => void;
}

export function ModelRow(props: ModelRowProps) {
  const { model, selected, recommended, progress } = props;
  const [busy, setBusy] = useState(false);
  const downloading = busy || (progress !== undefined && progress < 100);

  const download = async () => {
    setBusy(true);
    try { await props.onDownload(); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="litert-model"
          className="mt-1 accent-primary"
          checked={selected}
          disabled={!model.downloaded}
          onChange={props.onSelect}
          aria-label={`Usar ${model.label}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{model.label}</span>
            {recommended && <Badge variant="secondary">Recomendado</Badge>}
            {model.downloaded && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Descargado
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{model.blurb}</p>
          <p className="text-xs text-muted-foreground">
            ~{model.approxGB} GB · RAM sugerida {model.minRamGB} GB
          </p>
          {downloading && <Progress value={progress ?? 0} className="mt-2 h-2" />}
        </div>
        <RowActions {...props} busy={downloading} onDownloadClick={download} />
      </div>
    </div>
  );
}

/** Botonera de acciones de la fila (descargar / revelar / eliminar). */
function RowActions({
  model, busy, onDownloadClick, onDelete, onReveal,
}: ModelRowProps & { busy: boolean; onDownloadClick: () => void }) {
  if (!model.downloaded) {
    return (
      <Button size="sm" onClick={onDownloadClick} disabled={busy}>
        <Download className="mr-1 h-4 w-4" />
        {busy ? "Descargando…" : "Descargar"}
      </Button>
    );
  }
  return (
    <div className="flex gap-1">
      <Button size="icon" variant="ghost" onClick={onReveal} aria-label="Mostrar en carpeta">
        <FolderOpen className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Eliminar modelo">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
