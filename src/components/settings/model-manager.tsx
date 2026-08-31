"use client";

/**
 * Gestor del modelo local (Gemma vía LiteRT). Lista los modelos del catálogo con
 * su estado de descarga, permite descargar (con barra de progreso en vivo),
 * seleccionar el activo, eliminar y mostrar en carpeta. Recomienda el modelo que
 * mejor encaja con la RAM del equipo.
 */

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestModelForRam } from "@/lib/litert-models";
import { useLitertModels } from "./use-litert-models";
import { ModelRow } from "./model-row";
import { GenerationConfigField } from "./generation-config-field";

export function ModelManager() {
  const s = useLitertModels();

  if (s.loading) return <Skeleton className="h-64 w-full" />;
  if (!s.available) return <UnavailableCard />;

  const recommendedId = suggestModelForRam(s.totalRamGB);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelo local (Gemma)</CardTitle>
        <CardDescription>
          RAM detectada: {s.totalRamGB} GB. Se recomienda el modelo que mejor encaja
          con tu equipo. La inferencia corre 100% local (WebGPU).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {s.models.map((m) => (
          <ModelRow
            key={m.id}
            model={m}
            selected={s.selectedId === m.id}
            recommended={recommendedId === m.id}
            progress={s.progress[m.id]}
            onSelect={() => s.select(m.id)}
            onDownload={() => s.download(m.id)}
            onDelete={() => void s.remove(m.id)}
            onReveal={() => void s.reveal(m.id)}
          />
        ))}
        <Separator />
        <GenerationConfigField />
      </CardContent>
    </Card>
  );
}

/** Aviso cuando el puente de escritorio no está disponible (navegador/SSR). */
function UnavailableCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelo local (Gemma)</CardTitle>
        <CardDescription>
          La gestión de modelos sólo está disponible en la app de escritorio.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
