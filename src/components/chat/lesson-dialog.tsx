"use client";

/**
 * Lección de Emma al cerrar la escena. Aquí el búfer silencioso de errores por
 * fin se revela, ya fuera del turno de chat. La lección llega EN INGLÉS y con
 * AUDIO (directriz: Emma siempre habla inglés; la ayuda en español es un botón
 * aparte), y el diálogo SIEMPRE ofrece acciones de ruta: repetir el escenario o
 * saltar al siguiente recomendado del pathway.
 *
 * Presentacional: la decisión de generar o leer del histórico vive en
 * `use-end-session`; aquí sólo se pinta lo que llega.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Languages, Loader2, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PracticeRecommendation } from "@/domain/tutor/practice-recommender";
import type { SessionChallenge } from "@/domain/curriculum/challenge-selection";
import { getSessionChallenge } from "@/application/challenges/complete-challenge-use-case";
import { createChallengeRepository } from "@/infrastructure/persistence/challenge-repository";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Markdown } from "@/components/ui/markdown";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import type { LessonView } from "./use-end-session";
import { useKaraoke } from "./use-karaoke";

/** Voz reservada de Emma (tutora): siempre femenina, en-US-EmmaNeural. */
const EMMA_VOICE = "en-US-EmmaNeural";

interface Props {
  view: LessonView | null;
  open: boolean;
  onClose: () => void;
  scenario: Scenario;
  situation: SituationVariant | null;
  level: CefrLevel;
  /** Catálogo del nivel + navegación de ruta (repetir / siguiente escenario). */
  scenarios: Scenario[];
  onSelectScenario: (s: Scenario) => void;
  /** Abre la ayuda en español sobre un texto (reutiliza el TranslateDialog). */
  onTranslate: (text: string) => void;
}

/** Ruta de /practice preseleccionada para cada tipo de recomendación (kind "scenario" no navega aquí). */
function practiceHrefFor(rec: PracticeRecommendation): string | null {
  switch (rec.kind) {
    case "exercise":
      return `/practice?tab=exercises&unit=${rec.unit}&exercise=${rec.exerciseId}`;
    case "srs-review":
      return "/practice?tab=srs";
    case "minimal-pair":
      return `/practice?tab=pronunciation&contrast=${rec.contrastId}`;
    case "checklist":
      return `/practice?tab=assessment&level=${rec.level}`;
    case "scenario":
      return null;
  }
}

/** Decisión metodológica de Emma en una línea legible (andamiaje: español). */
function decisionLineOf(view: LessonView): string {
  const { promoted, passed, newLevel } = view.decision;
  if (promoted) return `✅ Emma decide: subes de nivel a ${newLevel}. ¡Gran trabajo!`;
  if (passed) return "✅ Emma decide: escenario superado — puedes avanzar en tu ruta.";
  return "🔁 Emma decide: repite este escenario para consolidar antes de avanzar.";
}

/** Reto del libro para la unidad de esta sesión (tolerante a fallo: sin reto, sin sección). */
function useSessionChallenge(active: boolean, scenarioType: string, level: CefrLevel) {
  const repo = useMemo(() => createChallengeRepository(), []);
  const [challenge, setChallenge] = useState<SessionChallenge | null>(null);
  useEffect(() => {
    if (!active) return;
    let alive = true;
    void (async () => {
      try {
        const result = await getSessionChallenge({ repo, scenarioType, level });
        if (alive) setChallenge(result);
      } catch {
        if (alive) setChallenge(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, repo, scenarioType, level]);
  return challenge;
}

export function LessonDialog({
  view, open, onClose, scenario, situation, level, scenarios, onSelectScenario, onTranslate,
}: Props) {
  const router = useRouter();
  // Audio de la lección con la voz de Emma (mismo motor que las burbujas).
  const karaoke = useKaraoke(view?.lesson ?? "", "feminine", EMMA_VOICE);
  const sessionChallenge = useSessionChallenge(open && !!view, scenario.scenarioType, level);

  // Siguiente paso de la ruta: nunca el escenario que se acaba de jugar —
  // si la recomendación coincide, rota al siguiente del catálogo del nivel.
  const recommended = view?.next
    ? scenarios.find((s) => s.scenarioType === view.next!.scenarioType) ?? null
    : null;
  const nextScenario = (() => {
    if (recommended && recommended.scenarioType !== scenario.scenarioType) return recommended;
    const idx = scenarios.findIndex((s) => s.scenarioType === scenario.scenarioType);
    return scenarios.length > 1 ? scenarios[(idx + 1) % scenarios.length] : null;
  })();

  const closeAnd = (action?: () => void): void => {
    karaoke.stop();
    onClose();
    action?.();
  };

  if (!view) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAnd()}>
      <DialogContent className="max-h-[85vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>🎓 Tu lección con Emma</DialogTitle>
          <DialogDescription>
            {scenario.title}
            {situation?.title ? ` · ${situation.title}` : ""} · nivel {level}
            {view.stored ? " · guardada en tu histórico" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-2">
          {/* Componente 1 — Enseñanza: correcciones + lección de Emma (audio). */}
          <section className="rounded-lg border bg-card p-4">
            {view.lesson && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  disabled={!karaoke.available || karaoke.loading}
                  onClick={() => (karaoke.playing ? karaoke.stop() : karaoke.play())}
                >
                  {karaoke.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : karaoke.playing ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {karaoke.playing ? "Detener" : "Escuchar a Emma"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => onTranslate(view.lesson!)}
                >
                  <Languages className="h-4 w-4" /> Ayuda en español
                </Button>
              </div>
            )}
            <Markdown>{view.report}</Markdown>
          </section>
          {/* Componente 2 — Decisión de Emma: avanzar de nivel o repetir. */}
          <section className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Decisión de Emma
            </p>
            <p className="mt-1 text-sm font-medium">{decisionLineOf(view)}</p>
            {view.next && !view.decision.promoted && (
              <p className="mt-1 text-xs text-muted-foreground">
                Sugerencia de la ruta: {view.next.title}.
              </p>
            )}
          </section>
          {/* Componente 3 — Próximos pasos: redirección de Emma hacia dónde seguir. */}
          {view.recommendations.length > 0 && (
            <section className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Próximos pasos
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {view.recommendations.map((rec, i) => {
                  const href = practiceHrefFor(rec);
                  const target =
                    rec.kind === "scenario"
                      ? scenarios.find((s) => s.scenarioType === rec.scenarioType) ?? null
                      : null;
                  return (
                    <Button
                      key={`${rec.kind}-${i}`}
                      variant="outline"
                      size="sm"
                      title={rec.reasonEs}
                      onClick={() => {
                        if (href) closeAnd(() => router.push(href));
                        else if (target) closeAnd(() => onSelectScenario(target));
                      }}
                    >
                      {rec.reasonEs}
                    </Button>
                  );
                })}
              </div>
            </section>
          )}
          {/* Componente 4 — Reto de la unidad: output forzado (paso 7 del libro). */}
          {sessionChallenge && (
            <section className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tu reto de esta unidad
              </p>
              <p className="mt-1 text-sm font-medium">
                Unidad {sessionChallenge.unit.number} · {sessionChallenge.unit.title}
              </p>
              <p className="mt-1 text-sm">{sessionChallenge.challenge.instructionsEs}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {sessionChallenge.challenge.criteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  closeAnd(() =>
                    router.push(`/practice?tab=challenges&unit=${sessionChallenge.unit.number}`),
                  )
                }
              >
                Ir al reto
              </Button>
            </section>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => closeAnd(() => onSelectScenario(scenario))}
          >
            <RotateCcw className="h-4 w-4" /> Practicar de nuevo
          </Button>
          {nextScenario ? (
            <Button className="gap-1" onClick={() => closeAnd(() => onSelectScenario(nextScenario))}>
              Siguiente: {nextScenario.title} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="gap-1" onClick={() => closeAnd()}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
