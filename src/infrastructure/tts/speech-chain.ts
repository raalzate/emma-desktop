/**
 * Cadena de voz Edge-TTS ⇒ Kokoro local ⇒ (Web Speech, a cargo del llamador).
 *
 * `synthesizeChain` devuelve audio + timings o RECHAZA: el rechazo significa
 * "usa Web Speech". Dos reglas:
 * - Circuit breaker de Edge por sesión: tras el primer fallo no se reintenta
 *   (Edge devuelve 403 siempre; cada intento costaba un viaje de red inútil).
 * - Presupuesto de la primera carga de Kokoro: mientras el modelo se descarga,
 *   Web Speech responde para no bloquear, pero la descarga sigue en segundo
 *   plano y el próximo clic ya encuentra el modelo listo.
 * Las dependencias entran por argumento para probar la política sin red ni modelo.
 */

import type { WordTiming } from "@/domain/ai/llm-port";
import type { KokoroState } from "./kokoro-tts";

export interface Speech {
  audioUrl: string;
  timings: WordTiming[];
}

export interface EdgeBreaker {
  tripped(): boolean;
  trip(): void;
}

/** Breaker de Edge: una vez abierto, no se cierra durante la sesión. */
export function createEdgeBreaker(): EdgeBreaker {
  let open = false;
  return { tripped: () => open, trip: () => void (open = true) };
}

export interface ChainDeps {
  edge: { available(): boolean; synthesize(): Promise<Speech> };
  kokoro: {
    available(): boolean;
    state(): KokoroState;
    warm(): Promise<void>;
    synthesize(): Promise<Speech>;
  };
  breaker: EdgeBreaker;
  /** Tope de espera a la carga del modelo de Kokoro. */
  budgetMs: number;
  sleep(ms: number): Promise<void>;
}

const BUDGET_EXCEEDED = "Kokoro no estuvo listo dentro del presupuesto";

async function tryEdge(deps: ChainDeps): Promise<Speech | null> {
  if (!deps.edge.available() || deps.breaker.tripped()) return null;
  try {
    return await deps.edge.synthesize();
  } catch {
    deps.breaker.trip();
    return null;
  }
}

/** Espera la carga del modelo hasta el presupuesto; la carga sigue si se agota. */
async function waitForModel(deps: ChainDeps): Promise<void> {
  if (deps.kokoro.state() === "ready") return;
  const loading = deps.kokoro.warm();
  loading.catch(() => undefined); // si pierde la carrera, el fallo no queda sin atender
  const expired = deps.sleep(deps.budgetMs).then(() => {
    throw new Error(BUDGET_EXCEEDED);
  });
  expired.catch(() => undefined); // si gana la carga, el vencimiento tardío no es un rechazo huérfano
  await Promise.race([loading, expired]);
}

export async function synthesizeChain(deps: ChainDeps): Promise<Speech> {
  const fromEdge = await tryEdge(deps);
  if (fromEdge) return fromEdge;

  if (!deps.kokoro.available()) throw new Error("Sin voz neuronal disponible");
  await waitForModel(deps);
  return deps.kokoro.synthesize();
}
