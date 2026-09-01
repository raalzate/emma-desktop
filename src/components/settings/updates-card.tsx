"use client";

/**
 * Ajustes → «Actualizaciones» (spec #137 FR-006). Andamiaje en español. El
 * estado llega del main por `update-status`, validado con la guarda de dominio;
 * la acción depende de la plataforma: auto (Windows/Linux) descarga e instala
 * al confirmar; manual (macOS con firma ad-hoc) abre la página de descargas.
 * Fuera de Electron (SSR/web) la tarjeta se muestra deshabilitada.
 */

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseUpdateStatus, type UpdateStatus } from "@/domain/updates/update-status";
import { getEmmaApi } from "./emma-api";

export function UpdatesCard() {
  const api = getEmmaApi();
  const [version, setVersion] = useState<string>("");
  const [status, setStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    if (!api) return;
    void api.updatesCurrentVersion().then(setVersion).catch(() => {});
    // Basura por el canal ⇒ null ⇒ se ignora (guarda de dominio).
    const off = api.onUpdateStatus((raw) => {
      const parsed = parseUpdateStatus(raw);
      if (parsed) setStatus(parsed);
    });
    return off;
  }, [api]);

  const busy = status?.state === "checking" || status?.state === "downloading";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actualizaciones</CardTitle>
        <CardDescription>
          {version ? `Versión instalada: ${version}.` : "Versión instalada: n/d."}{" "}
          La app avisa cuando hay una nueva; en macOS la instalación es manual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!api || busy}
            onClick={() => void api?.updatesCheck()}
          >
            {status?.state === "checking" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Buscar actualizaciones
          </Button>

          {status?.state === "available" && status.action === "auto" && (
            <Button size="sm" className="gap-1" onClick={() => void api?.updatesDownload()}>
              <Download className="h-4 w-4" /> Descargar v{status.version}
            </Button>
          )}
          {status?.state === "available" && status.action === "manual" && (
            <Button size="sm" className="gap-1" onClick={() => void api?.updatesOpenDownload()}>
              <ExternalLink className="h-4 w-4" /> Abrir descargas (v{status.version})
            </Button>
          )}
          {status?.state === "ready" && (
            <Button size="sm" className="gap-1" onClick={() => void api?.updatesInstall()}>
              <RotateCcw className="h-4 w-4" /> Reiniciar y actualizar
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {!api && "Disponible sólo en la app de escritorio."}
          {api && !status && "Sin novedades por ahora."}
          {status?.state === "checking" && "Buscando actualizaciones…"}
          {status?.state === "none" && "Estás al día."}
          {status?.state === "available" &&
            (status.action === "auto"
              ? `Hay una versión nueva (v${status.version}) lista para descargar.`
              : `Hay una versión nueva (v${status.version}). En macOS se descarga desde la página del release (clic derecho → Abrir la primera vez).`)}
          {status?.state === "downloading" && `Descargando… ${status.percent}%`}
          {status?.state === "ready" &&
            `v${status.version} descargada: se instala al reiniciar la app.`}
          {status?.state === "error" &&
            "No se pudo comprobar (¿sin conexión?). La app sigue funcionando normal."}
        </p>
      </CardContent>
    </Card>
  );
}
