"use client";

/**
 * Cierre de sesión y lección de Emma. Aquí el búfer silencioso de errores por
 * fin se revela, ya fuera del turno de chat. La lección llega EN INGLÉS y con
 * AUDIO (directriz: Emma siempre habla inglés; la ayuda en español es un botón
 * aparte), y el dialog SIEMPRE ofrece acciones de ruta: repetir el escenario o
 * saltar al siguiente recomendado del pathway.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Flag, Languages, Loader2, Play, RotateCcw, Square } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useEmma } from "@/interface/emma-context";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import type { ChatTurn, SilentError } from "@/domain/chat/simulation-session";
import { useFinishSession } from "./use-finish-session";
import { useKaraoke } from "./use-karaoke";

/** Voz reservada de Emma (tutora): siempre femenina, en-US-EmmaNeural. */
const EMMA_VOICE = "en-US-EmmaNeural";

interface Props {
  scenario: Scenario;
  situation: SituationVariant | null;
  level: CefrLevel;
  turns: number;
  errors: SilentError[];
  /** Turnos de la escena: alimentan las métricas de progreso del método. */
  messages: ChatTurn[];
  disabled?: boolean;
  /** El agente decidió cerrar la escena: dispara el feedback sin pulsar el botón. */
  autoFinish?: boolean;
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

export function EndSession({
  scenario, situation, level, turns, errors, messages, disabled, autoFinish,
  scenarios, onSelectScenario, onTranslate,
}: Props) {
  const { runtime } = useEmma();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { outcome, running, finish, reset } = useFinishSession({
    runtime: runtime!, scenario, situation, level, turns, errors, messages,
  });
  // Audio de la lección con la voz de Emma (mismo motor que las burbujas).
  const karaoke = useKaraoke(outcome?.lesson ?? "", "feminine", EMMA_VOICE);

  // Reto del libro (paso 7) para la unidad de esta sesión: tolerante a fallo,
  // si no hay unidad o el repo falla, simplemente no se muestra la sección.
  const challengeRepo = useMemo(() => createChallengeRepository(), []);
  const [sessionChallenge, setSessionChallenge] = useState<SessionChallenge | null>(null);
  useEffect(() => {
    if (!outcome) return;
    let alive = true;
    void (async () => {
      try {
        const result = await getSessionChallenge({
          repo: challengeRepo,
          scenarioType: scenario.scenarioType,
          level,
        });
        if (alive) setSessionChallenge(result);
      } catch {
        if (alive) setSessionChallenge(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [outcome, challengeRepo, scenario.scenarioType, level]);

  useEffect(() => {
    if (outcome) {
      setOpen(true);
      toast({ title: "Sesión evaluada", description: outcome.verdict });
    }
  }, [outcome, toast]);

  // Cierre automático (una sola vez): breve pausa para que el usuario lea la
  // despedida de la persona antes de que Emma entregue la lección.
  const autoFired = useRef(false);
  useEffect(() => {
    if (!autoFinish || autoFired.current || running || outcome) return;
    autoFired.current = true;
    const timer = setTimeout(() => void finish(), 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFinish]);

  // Siguiente paso de la ruta: nunca el escenario que se acaba de jugar —
  // si la recomendación coincide, rota al siguiente del catálogo del nivel.
  const recommended = outcome?.next
    ? scenarios.find((s) => s.scenarioType === outcome.next!.scenarioType) ?? null
    : null;
  const nextScenario = (() => {
    if (recommended && recommended.scenarioType !== scenario.scenarioType) return recommended;
    const idx = scenarios.findIndex((s) => s.scenarioType === scenario.scenarioType);
    return scenarios.length > 1 ? scenarios[(idx + 1) % scenarios.length] : null;
  })();

  // Decisión metodológica de Emma (avanzar / superado / repetir).
  const decision = outcome?.decision;
  const decisionLine = decision
    ? decision.promoted
      ? `✅ Emma decide: subes de nivel a ${decision.newLevel}. ¡Gran trabajo!`
      : decision.passed
        ? "✅ Emma decide: escenario superado — puedes avanzar en tu ruta."
        : "🔁 Emma decide: repite este escenario para consolidar antes de avanzar."
    : "";

  const closeAnd = (action?: () => void): void => {
    karaoke.stop();
    setOpen(false);
    reset();
    setSessionChallenge(null);
    action?.();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={finish} disabled={disabled || running} className="gap-1">
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
        {running ? "Evaluando…" : "Finalizar y ver lección"}
      </Button>
      <Dialog open={open && !!outcome} onOpenChange={(o) => !o && closeAnd()}>
        <DialogContent className="max-h-[85vh] max-w-2xl">
          <DialogHeader>
            <DialogTitle>🎓 Tu lección con Emma</DialogTitle>
            <DialogDescription>
              {scenario.title}
              {situation?.title ? ` · ${situation.title}` : ""} · nivel {level}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-2">
            {/* Componente 1 — Enseñanza: correcciones + lección de Emma (audio). */}
            <section className="rounded-lg border bg-card p-4">
              {outcome?.lesson && (
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
                    onClick={() => onTranslate(outcome.lesson!)}
                  >
                    <Languages className="h-4 w-4" /> Ayuda en español
                  </Button>
                </div>
              )}
              {outcome ? (
                <Markdown>{outcome.report}</Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">Preparando la lección…</p>
              )}
            </section>
            {/* Componente 2 — Decisión de Emma: avanzar de nivel o repetir. */}
            {decision && (
              <section className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Decisión de Emma
                </p>
                <p className="mt-1 text-sm font-medium">{decisionLine}</p>
                {outcome?.next && !decision.promoted && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sugerencia de la ruta: {outcome.next.title}.
                  </p>
                )}
              </section>
            )}
            {/* Componente 3 — Próximos pasos: redirección de Emma hacia dónde seguir. */}
            {outcome && outcome.recommendations.length > 0 && (
              <section className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Próximos pasos
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {outcome.recommendations.map((rec, i) => {
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
    </>
  );
}
