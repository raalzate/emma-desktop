"use client";

/**
 * Puente entre el motor de onboarding (que espera un OnboardingIo síncrono en su
 * lógica pero asíncrono en `ask`) y la UI de React. Cada `io.ask(prompt)`:
 *   1. pinta la burbuja de Emma con el prompt,
 *   2. devuelve una Promise que queda "colgada",
 *   3. se resuelve cuando el usuario envía su respuesta (`submit`).
 *
 * El `resolve` actual vive en un ref, de modo que sólo hay una pregunta viva a
 * la vez (flujo estricto por turnos). Un segundo envío sin pregunta activa se
 * ignora, evitando dobles envíos.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { OnboardingIo } from "@/domain/onboarding/i-onboarding-repository";
import { REQUIRED_FIELDS } from "@/domain/onboarding/agentic-onboarding";
import type { EmmaRuntime } from "@/interface/emma-runtime";

export type BubbleRole = "emma" | "user";
export interface Bubble {
  id: number;
  role: BubbleRole;
  text: string;
}

/** Aviso en español cuando el motor de IA no pudo atender el onboarding. */
export const ONBOARDING_ERROR =
  "No pude conectar con el motor de IA. Revisá el modelo local o la clave de la nube en Ajustes y volvé a intentar.";

// La escala real del flujo agéntico: campos requeridos, no pasos de formulario.
const TOTAL_STEPS = REQUIRED_FIELDS.length;

export interface OnboardingFlow {
  messages: Bubble[];
  thinking: boolean;
  done: boolean;
  /** false si el flujo terminó por tope de turnos con el perfil incompleto. */
  completed: boolean;
  progress: number;
  total: number;
  submit: (answer: string) => void;
}

export function useOnboardingFlow(
  runtime: EmmaRuntime | null,
  ready: boolean,
  onComplete: () => void | Promise<void>,
): OnboardingFlow {
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [thinking, setThinking] = useState(true);
  const [done, setDone] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [captured, setCaptured] = useState(0);
  const [total, setTotal] = useState(TOTAL_STEPS);
  const resolveRef = useRef<((v: string) => void) | null>(null);
  const idRef = useRef(0);
  const startedRef = useRef(false);

  const push = useCallback((role: BubbleRole, text: string) => {
    setMessages((prev) => [...prev, { id: idRef.current++, role, text }]);
  }, []);

  // Resuelve la pregunta viva; sin pregunta activa el envío se descarta.
  const submit = useCallback(
    (answer: string) => {
      const resolve = resolveRef.current;
      if (!resolve) return;
      resolveRef.current = null;
      push("user", answer);
      setThinking(true);
      resolve(answer);
    },
    [push],
  );

  const createIo = useCallback(
    (): OnboardingIo => ({
      ask: (prompt) => {
        push("emma", prompt);
        setThinking(false);
        return new Promise<string>((resolve) => {
          resolveRef.current = resolve;
        });
      },
      notify: (message) => {
        push("emma", message);
      },
    }),
    [push],
  );

  useEffect(() => {
    if (!ready || !runtime || startedRef.current) return;
    startedRef.current = true;
    const onProgress = (c: number, t: number) => {
      setCaptured(c);
      setTotal(t);
    };
    const fail = () => {
      // El motor no pudo responder (sin IA disponible, error del runtime local).
      // Se cierra el flujo con el aviso: nunca se deja el "pensando" eterno.
      setThinking(false);
      setDone(true);
      setCompleted(false);
      push("emma", ONBOARDING_ERROR);
    };
    void runtime.runAgenticOnboarding(createIo(), onProgress).then(async (result) => {
      setThinking(false);
      // El flujo termina siempre (no dejamos un composer muerto sin pregunta
      // viva); `completed` distingue perfil completo de pausa por tope de
      // turnos, que la pantalla ofrece retomar.
      setDone(true);
      setCompleted(result.completed);
      await onComplete();
    }, fail).catch(fail);
  }, [ready, runtime, createIo, onComplete, push]);

  return {
    messages,
    thinking,
    done,
    completed,
    progress: done ? total : Math.min(captured, total),
    total,
    submit,
  };
}
