"use client";

/**
 * Puerta de entrada: dónde estás en la ruta y qué escena toca.
 *
 * El "why": la app abría directamente en una conversación, sin contexto de
 * progreso — no se veía el nivel, ni lo superado, ni cuánto queda. Aquí manda
 * la ruta: nivel actual, escalera A1→C1 y el trazado de escenas, y desde el
 * trazado se entra a la conversación. El detalle (métricas, plan, retos) sigue
 * viviendo en Mi progreso y Práctica, para que esta pantalla haga UNA cosa.
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpenCheck, BarChart3, Settings, Play, Route } from "lucide-react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProgressData } from "./use-progress-data";
import { currentPathway } from "./pathway-select";
import { PathwayTrail } from "./pathway-trail";
import { LevelLadder } from "./level-ladder";
import { PathwayProgress } from "./pathway-progress";
import { ProgressSkeleton } from "./progress-skeleton";

export function PathwayHome({ runtime, level }: { runtime: EmmaRuntime; level: string }) {
  const router = useRouter();
  const { roadmap, recommendation, loading } = useProgressData(runtime, level);

  const openScene = (scenarioType: string) =>
    router.push(`/chat/?scenario=${encodeURIComponent(scenarioType)}`);

  if (loading || !roadmap) return <ProgressSkeleton />;
  const pathway = currentPathway(roadmap);

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6 pb-16">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Route className="h-3.5 w-3.5" />
            Tu ruta
          </p>
          <h1 className="text-2xl font-semibold">Nivel {level}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="mr-1">{level}</Badge>
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/practice/" aria-label="Práctica">
              <BookOpenCheck className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/progress/" aria-label="Mi progreso">
              <BarChart3 className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/settings/" aria-label="Configuración">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <LevelLadder current={level} />
      <PathwayProgress pathway={pathway} level={level} />

      {recommendation && (
        <Button className="w-full gap-2" onClick={() => openScene(recommendation.scenarioType)}>
          <Play className="h-4 w-4" />
          Continuar con {recommendation.title}
        </Button>
      )}

      <PathwayTrail
        pathway={pathway}
        recommendedType={recommendation?.scenarioType}
        onSelect={openScene}
      />

      <p className="text-center text-xs text-muted-foreground">
        Elige cualquier escena del trazado para practicarla.
      </p>
    </main>
  );
}
