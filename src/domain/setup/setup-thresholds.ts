/**
 * Umbrales de latencia del chequeo de setup (FR-029, Q3). Son valores iniciales:
 * se recalibran midiendo en un equipo modesto y la prueba los fija.
 */

export type Speed = "ok" | "slow" | "very-slow";

export interface LatencyThresholds {
  /** Por debajo de esto es "ok". */
  readonly ok: number;
  /** Por debajo de esto es "slow"; desde aquí es "very-slow". */
  readonly slow: number;
}

export const VOICE_MS: LatencyThresholds = { ok: 1500, slow: 5000 };
export const AI_MS: LatencyThresholds = { ok: 5000, slow: 15000 };

/** Tope de espera por sonda (SC-003): al agotarlo la prueba es `timeout`. */
export const PROBE_TIMEOUT_MS = { voice: 15000, ai: 20000, mic: 5000 } as const;

export function classifyLatency(ms: number, t: LatencyThresholds): Speed {
  if (ms < t.ok) return "ok";
  if (ms < t.slow) return "slow";
  return "very-slow";
}
