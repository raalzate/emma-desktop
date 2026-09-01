"use client";

/**
 * Cierre de sesión visto desde la UI: decide si hay que GENERAR la lección o si
 * ya está guardada en el histórico, la persiste una sola vez y gobierna la
 * apertura del diálogo.
 *
 * El "why": antes cada pulsación regeneraba la lección con el LLM, así que
 * revisar una sesión vieja devolvía un texto distinto del que se leyó aquel día
 * (y costaba una generación entera). Ahora la lección generada se guarda con la
 * conversación y reabrirla es lectura pura.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import type { ChatTurn, SilentError } from "@/domain/chat/simulation-session";
import type { PracticeRecommendation } from "@/domain/tutor/practice-recommender";
import type { LessonDecision, SessionLesson } from "@/domain/feedback/session-lesson";
import { useFinishSession } from "./use-finish-session";

/** Pausa antes del cierre automático: da tiempo a leer la despedida del personaje. */
const AUTO_FINISH_DELAY_MS = 2500;

/** Lo que el diálogo necesita pintar, venga de una generación nueva o del histórico. */
export interface LessonView {
  report: string;
  lesson: string | null;
  verdict: string;
  decision: LessonDecision;
  next: { scenarioType: string; title: string } | null;
  /**
   * Próximos pasos. Vacío al revisar una lección guardada: dependen del estado
   * ACTUAL de la ruta (errores, SRS, escenarios pendientes), que ya cambió.
   */
  recommendations: PracticeRecommendation[];
  /** La lección se leyó del histórico (no se gastó una generación). */
  stored: boolean;
}

interface Args {
  runtime: EmmaRuntime;
  scenario: Scenario;
  situation: SituationVariant | null;
  level: CefrLevel;
  turns: number;
  errors: SilentError[];
  messages: ChatTurn[];
  /** Lección ya guardada de esta conversación, si la sesión se reabrió. */
  storedLesson: SessionLesson | null;
  /** Sube la lección recién generada para que el padre la persista. */
  onLessonReady: (lesson: SessionLesson) => void;
  /** El agente cerró la escena: dispara la lección sin pulsar nada. */
  autoFinish: boolean;
}

export function useEndSession(a: Args) {
  const { outcome, running, finish, reset } = useFinishSession({
    runtime: a.runtime,
    scenario: a.scenario,
    situation: a.situation,
    level: a.level,
    turns: a.turns,
    errors: a.errors,
    messages: a.messages,
  });
  const [open, setOpen] = useState(false);
  // La lección se guarda UNA vez: el efecto corre en cada render con outcome.
  const persisted = useRef(false);

  useEffect(() => {
    if (!outcome || persisted.current) return;
    persisted.current = true;
    a.onLessonReady({
      report: outcome.report,
      lesson: outcome.lesson,
      verdict: outcome.verdict,
      decision: outcome.decision,
      at: Date.now(),
    });
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]);

  // Cierre automático (una sola vez). Con lección guardada no se regenera nada:
  // la escena reabierta ya terminó y su lección es la de aquel día.
  const autoFired = useRef(false);
  useEffect(() => {
    if (!a.autoFinish || autoFired.current || running || outcome || a.storedLesson) return;
    autoFired.current = true;
    const timer = setTimeout(() => void finish(), AUTO_FINISH_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.autoFinish, a.storedLesson]);

  const view: LessonView | null = outcome
    ? { ...outcome, stored: false }
    : a.storedLesson
      ? { ...a.storedLesson, next: null, recommendations: [], stored: true }
      : null;

  /** Abre la lección: la guardada se muestra tal cual; si no hay, se genera. */
  const review = useCallback(() => {
    if (a.storedLesson) {
      setOpen(true);
      return;
    }
    void finish();
  }, [a.storedLesson, finish]);

  const close = useCallback(() => {
    setOpen(false);
    // La lección generada se descarta del estado vivo, no del histórico: ya se
    // persistió, y al reabrir la sesión vuelve como `storedLesson`.
    reset();
  }, [reset]);

  return { view, open, running, review, close, hasStoredLesson: a.storedLesson !== null };
}
