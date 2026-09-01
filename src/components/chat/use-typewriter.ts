"use client";

/**
 * Revelado tipo máquina de escribir de una secuencia de textos, uno tras otro.
 *
 * El revelado se calcula contra el reloj (ver domain/chat/typewriter), no
 * sumando una letra por frame: si el navegador se salta frames el texto se
 * pone al día en vez de arrastrar el retraso. Respeta `prefers-reduced-motion`
 * y permite saltar la animación con un clic.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BEAT_PAUSE_MS,
  DEFAULT_CHARS_PER_SECOND,
  revealedChars,
  typingDurationMs,
} from "@/domain/chat/typewriter";

/** ¿El sistema pide movimiento reducido? (SSR: se asume que no). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Options {
  /** Falso ⇒ todo aparece de golpe (historial reabierto, movimiento reducido). */
  animate?: boolean;
  charsPerSecond?: number;
}

export interface TypewriterState {
  /** Textos ya revelados, el último posiblemente a medias. */
  visible: string[];
  /** La secuencia completa terminó de teclearse. */
  done: boolean;
  /** Salta al final (clic del aprendiz que no quiere esperar). */
  skip: () => void;
}

export function useTypewriter(texts: string[], options: Options = {}): TypewriterState {
  const { animate = true, charsPerSecond = DEFAULT_CHARS_PER_SECOND } = options;
  // El motivo de no animar se decide UNA vez al montar: cambiar de criterio a
  // mitad de la narración haría saltar el texto delante del aprendiz.
  const [instant, setInstant] = useState(() => !animate || prefersReducedMotion());
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(0);
  // Ids separados: cancelar un timeout con `cancelAnimationFrame` (o al revés)
  // deja vivo el temporizador real y mata uno ajeno.
  const frame = useRef(0);
  const pause = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skip = useCallback(() => setInstant(true), []);

  // La dependencia es el TEXTO del compás, no el array: `texts` se recrea en
  // cada render del padre y reiniciaría el tecleo desde cero cada vez.
  const current = texts[index] ?? "";
  const pending = !instant && index < texts.length;

  useEffect(() => {
    if (!pending) return;
    const startedAt = performance.now();
    const duration = typingDurationMs(current, charsPerSecond);
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      setChars(revealedChars(elapsed, current.length, charsPerSecond));
      if (elapsed < duration) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      // Compás terminado: una pausa breve y arranca el siguiente.
      pause.current = setTimeout(() => {
        setChars(0);
        setIndex((i) => i + 1);
      }, BEAT_PAUSE_MS);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame.current);
      if (pause.current) clearTimeout(pause.current);
    };
  }, [pending, current, charsPerSecond]);

  if (instant) return { visible: texts, done: true, skip };

  const visible = texts.slice(0, index);
  const partial = texts[index]?.slice(0, chars);
  return {
    visible: partial ? [...visible, partial] : visible,
    done: index >= texts.length,
    skip,
  };
}
