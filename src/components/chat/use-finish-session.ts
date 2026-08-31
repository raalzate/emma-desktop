"use client";

/**
 * Cierra la sesión: arma la métrica, pide el reporte en markdown, evalúa la
 * progresión (promoción de nivel) y, si el escenario se superó, lo marca como
 * pasado. Devuelve el reporte + un veredicto legible con el próximo escenario.
 */

import { useState } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import type { ChatTurn, SilentError } from "@/domain/chat/simulation-session";
import { isPass } from "@/domain/progression/promotion-policy";
import type { PracticeRecommendation } from "@/domain/tutor/practice-recommender";

interface Args {
  runtime: EmmaRuntime;
  scenario: Scenario;
  situation: SituationVariant | null;
  level: CefrLevel;
  turns: number;
  errors: SilentError[];
  /** Turnos de la escena: de sus tiempos y longitudes salen las métricas del método. */
  messages: ChatTurn[];
}

export interface FinishOutcome {
  report: string;
  verdict: string;
  /** Lección de Emma en inglés hablado (para audio y ayuda en español). */
  lesson: string | null;
  /** Siguiente escenario recomendado en la ruta, si hay uno pendiente. */
  next: { scenarioType: string; title: string } | null;
  /** Decisión metodológica de Emma: avanzar de nivel, pasar o repetir. */
  decision: { promoted: boolean; newLevel: string; passed: boolean };
  /** Próximos pasos sugeridos por EMMA (ejercicio, SRS, par mínimo, escenario, checklist). */
  recommendations: PracticeRecommendation[];
}

// Traduce el resultado de progresión a un mensaje breve para el toast.
function verdictOf(promoted: boolean, newLevel: string, passed: boolean, next?: string): string {
  const tail = next ? ` Sugerencia: ${next}.` : "";
  if (promoted) return `¡Subiste a ${newLevel}!${tail}`;
  if (passed) return `¡Escenario superado!${tail}`;
  return `Sigue practicando.${tail}`;
}

export function useFinishSession(a: Args) {
  const [outcome, setOutcome] = useState<FinishOutcome | null>(null);
  const [running, setRunning] = useState(false);

  const finish = async () => {
    setRunning(true);
    const metric = { turns: a.turns, errors: a.errors.length };
    const { report, lesson, recommendations } = await a.runtime.finishSession({
      scenario: a.scenario, metric, errors: a.errors, level: a.level,
      situation: a.situation, situationTitle: a.situation?.title,
      messages: a.messages,
    });
    const passed = isPass(metric, a.level);
    const prog = await a.runtime.evaluateProgression(a.level, metric);
    if (passed || prog.promoted) await a.runtime.markPassed(a.level, a.scenario.scenarioType);
    const next = await a.runtime.recommendNext(a.level);
    setOutcome({
      report,
      verdict: verdictOf(prog.promoted, prog.newLevel, passed, next?.title),
      lesson,
      next: next ? { scenarioType: next.scenarioType, title: next.title } : null,
      decision: { promoted: prog.promoted, newLevel: prog.newLevel, passed },
      recommendations,
    });
    setRunning(false);
  };

  return { outcome, running, finish, reset: () => setOutcome(null) };
}
