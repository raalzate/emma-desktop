"use client";

/**
 * Ajustes → «Updates» (spec #137 FR-006). El
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
        <CardTitle>Updates</CardTitle>
        <CardDescription>
          {version ? `Installed version: ${version}.` : "Installed version: n/a."}{" "}
          The app lets you know when a new one is out; on macOS installation is manual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            title="Consulta si hay una versión nueva de EMMA"
            disabled={!api || busy}
            onClick={() => void api?.updatesCheck()}
          >
            {status?.state === "checking" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check for updates
          </Button>

          {status?.state === "available" && status.action === "auto" && (
            <Button size="sm" className="gap-1" title="Descarga la nueva versión en segundo plano; te avisa cuando esté lista" onClick={() => void api?.updatesDownload()}>
              <Download className="h-4 w-4" /> Download v{status.version}
            </Button>
          )}
          {status?.state === "available" && status.action === "manual" && (
            <Button size="sm" className="gap-1" title="Abre la página de descargas en el navegador; en macOS instalás a mano" onClick={() => void api?.updatesOpenDownload()}>
              <ExternalLink className="h-4 w-4" /> Open downloads (v{status.version})
            </Button>
          )}
          {status?.state === "ready" && (
            <Button size="sm" className="gap-1" title="Cierra EMMA e instala la versión descargada" onClick={() => void api?.updatesInstall()}>
              <RotateCcw className="h-4 w-4" /> Restart and update
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {!api && "Only available in the desktop app."}
          {api && !status && "Nothing new for now."}
          {status?.state === "checking" && "Checking for updates…"}
          {status?.state === "none" && "You're up to date."}
          {status?.state === "available" &&
            (status.action === "auto"
              ? `A new version (v${status.version}) is ready to download.`
              : `A new version (v${status.version}) is out. On macOS, download it from the release page (right-click → Open the first time).`)}
          {status?.state === "downloading" && `Downloading… ${status.percent}%`}
          {status?.state === "ready" &&
            `v${status.version} downloaded: it installs when the app restarts.`}
          {status?.state === "error" &&
            "Could not check (offline?). The app keeps working as usual."}
        </p>
      </CardContent>
    </Card>
  );
}
