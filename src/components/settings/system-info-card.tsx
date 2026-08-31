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
    ["Sistema operativo", `${g("osName")} ${g("osVersion")} (${g("arch")})`],
    ["CPU", `${g("cpuModel")} · ${g("cpuCores")} núcleos`],
    ["Memoria", `${g("freeRamGB")} GB libres de ${g("totalRamGB")} GB`],
    ["Disco (datos)", `${g("diskFreeGB")} GB libres de ${g("diskTotalGB")} GB`],
    ["Versión de EMMA", String(g("appVersion"))],
    ["Electron / Chromium", `${g("electronVersion")} / ${g("chromeVersion")}`],
    ["Node", String(g("nodeVersion"))],
    ["Carpeta de datos", String(g("userDataPath"))],
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
        <CardTitle>Sistema</CardTitle>
        <CardDescription>Datos del equipo y del runtime de EMMA.</CardDescription>
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
        <CardTitle>Sistema</CardTitle>
        <CardDescription>
          La información del sistema sólo está disponible en la app de escritorio.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
