"use client";

/**
 * Utilidades de movimiento de la gamificación (#216, FR-008): sin dependencia
 * nueva. En el servidor (y en las pruebas de render estático) se pinta el valor
 * final; en el cliente el valor arranca en cero y crece. Con
 * `prefers-reduced-motion` no hay animación: se muestra el valor de una.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Valor para una transición CSS que "se llena" al montar: 0 en el primer
 * pintado del cliente y el real en el siguiente frame. Los cambios posteriores
 * los anima la propia transición.
 */
export function useRevealedValue(value: number): number {
  const [shown, setShown] = useState(value);
  useIsoLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    setShown(0);
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
    // Sólo al montar: después la transición CSS sigue a `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setShown(value);
  }, [value]);
  return shown;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Número que cuenta desde el valor anterior (0 al montar) hasta `value`. */
export function useCountUp(value: number, durationMs = 900): number {
  const [shown, setShown] = useState(value);
  const from = useRef(0);

  useIsoLayoutEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setShown(Math.round(origin + (value - origin) * easeOutCubic(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    setShown(origin);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return shown;
}
