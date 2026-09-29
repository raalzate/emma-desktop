"use client";

/**
 * Tarjeta de información del sistema (SO/CPU/RAM/disco/versiones). Todo lo que
 * requiere Node/Electron se lee en el proceso main vía systemInfo(); aquí sólo se
 * presenta. Útil para diagnóstico (WebGPU depende del Chromium embebido).
 */

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmmaApi } from "./emma-api";

type Info = Record<string, unknown>;

/** Filas a mostrar: [etiqueta, texto derivado del info]. */
function rows(i: Info): [string, string][] {
  const g = (k: string) => (i[k] ?? "n/d") as string | number;
  return [
    ["Operating system", `${g("osName")} ${g("osVersion")} (${g("arch")})`],
    ["CPU", `${g("cpuModel")} · ${g("cpuCores")} cores`],
    ["Memory", `${g("freeRamGB")} GB free of ${g("totalRamGB")} GB`],
    ["Disk (data)", `${g("diskFreeGB")} GB free of ${g("diskTotalGB")} GB`],
    ["EMMA version", String(g("appVersion"))],
    ["Electron / Chromium", `${g("electronVersion")} / ${g("chromeVersion")}`],
    ["Node", String(g("nodeVersion"))],
    ["Data folder", String(g("userDataPath"))],
  ];
}

export function SystemInfoCard() {
  const [info, setInfo] = useState<Info | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const api = getEmmaApi();
    if (!api) return setAvailable(false);
    void api.systemInfo().then(setInfo);
  }, []);

  if (!available) return <Unavailable />;
  if (!info) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>System</CardTitle>
        <CardDescription>Details about your device and EMMA's runtime.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="divide-y text-sm">
          {rows(info).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

/** Aviso cuando no hay puente de escritorio (navegador/SSR). */
function Unavailable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System</CardTitle>
        <CardDescription>
          System information is only available in the desktop app.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
