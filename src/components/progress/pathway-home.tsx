"use client";

/**
 * Puerta de entrada: dónde estás en la ruta y qué escena toca.
 *
 * El "why": la app abría directamente en una conversación, sin contexto de
 * progreso. Aquí manda la ruta: saludo, escalera A1→C1 y el trazado de escenas
 * en su tarjeta, y desde el trazado (o la recomendación) se entra a la
 * conversación. La navegación entre secciones vive en el AppShell lateral.
 *
 * FR-024: la pill de racha se omite a propósito — useProgressData no expone
 * ningún dato de racha todavía y este rediseño no agrega lógica de dominio.
 */

import { useRouter } from "next/navigation";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { pathwayPassedCount, pathwayTotal } from "@/domain/pathway/pathway";
import { nextLevel } from "@/domain/cefr/cefr-ladder";
import { useProgressData } from "./use-progress-data";
import { currentPathway } from "./pathway-select";
import { PathwayTrail } from "./pathway-trail";
import { LevelLadder } from "./level-ladder";
import { PathwayProgress } from "./pathway-progress";
import { ProgressSkeleton } from "./progress-skeleton";
import { RecommendedNext } from "./recommended-next";

export function PathwayHome({ runtime, level }: { runtime: EmmaRuntime; level: string }) {
  const router = useRouter();
  const { roadmap, recommendation, loading } = useProgressData(runtime, level);

  const openScene = (scenarioType: string) =>
    router.push(`/chat/?scenario=${encodeURIComponent(scenarioType)}`);

  if (loading || !roadmap) return <ProgressSkeleton />;
  const pathway = currentPathway(roadmap);
  const passed = pathwayPassedCount(pathway);
  const total = pathwayTotal(pathway);
  const percent = total ? Math.round((passed / total) * 100) : 0;
  const goal = nextLevel(level);

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 pb-16">
      <header className="space-y-1">
        <h1 className="font-headline text-[32px] font-bold leading-tight">¡Hola de nuevo!</h1>
        <p className="text-muted-foreground">
          {goal
            ? `Vas camino a ${goal}. Elige una escena del trazado para practicarla.`
            : `Estás en ${level}, el último nivel de la ruta. Elige una escena para seguir afinando.`}
        </p>
      </header>

      <LevelLadder current={level} percent={percent} />

      <section className="space-y-5 rounded-bubble border border-border bg-card p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-lg font-semibold">Tu ruta · Nivel {level}</h2>
          <span className="text-sm text-muted-foreground">
            {passed} de {total} escenas completadas
          </span>
        </div>
        <PathwayTrail
          pathway={pathway}
          recommendedType={recommendation?.scenarioType}
          onSelect={openScene}
        />
        <PathwayProgress pathway={pathway} level={level} />
      </section>

      <RecommendedNext recommendation={recommendation} onPractice={openScene} />
    </main>
  );
}
