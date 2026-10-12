/**
 * Cadena de voz Kokoro local ⇒ (Web Speech, a cargo del llamador).
 *
 * `synthesizeChain` devuelve audio + timings o RECHAZA: el rechazo significa
 * "usa Web Speech". Regla: presupuesto de la primera carga de Kokoro. Mientras
 * el modelo se descarga, Web Speech responde para no bloquear, pero la descarga
 * sigue en segundo plano y el próximo clic ya encuentra el modelo listo.
 * Las dependencias entran por argumento para probar la política sin red ni modelo.
 */

import type { WordTiming } from "@/domain/ai/llm-port";
import type { KokoroState } from "./kokoro-tts";

/** Motor neuronal que produjo el audio. */
export type SpeechEngine = "kokoro";

/** Lo que devuelve cada motor: audio + timings, sin saber de la cadena. */
export interface EngineSpeech {
  audioUrl: string;
  timings: WordTiming[];
}

export interface Speech extends EngineSpeech {
  /** Motor que respondió realmente (la cadena lo sabe). */
  engine: SpeechEngine;
}

export interface ChainDeps {
  kokoro: {
    available(): boolean;
    state(): KokoroState;
    warm(): Promise<void>;
    synthesize(): Promise<EngineSpeech>;
  };
  /** Tope de espera a la carga del modelo de Kokoro. */
  budgetMs: number;
  sleep(ms: number): Promise<void>;
}

const BUDGET_EXCEEDED = "Kokoro no estuvo listo dentro del presupuesto";

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
  if (!deps.kokoro.available()) throw new Error("Sin voz neuronal disponible");
  await waitForModel(deps);
  return { ...(await deps.kokoro.synthesize()), engine: "kokoro" };
}
