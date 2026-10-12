/**
 * Voz neuronal local con Kokoro-82M (kokoro-js sobre transformers.js), la caída
 * de Edge-TTS. El modelo corre en un Web Worker (`kokoro.worker.ts`) con WASM
 * (CPU), nunca WebGPU: así no compite por la GPU con Gemma (LiteRT) ni bloquea
 * la UI. Se mide fp32 contra q8 en WASM: fp32 es más rápido (ver el worker).
 * El modelo (~326 MB) se descarga una vez y queda en la caché del navegador.
 *
 * El motor es un singleton con reset si la carga falla o el worker cae (un
 * fallo no deja el módulo roto para siempre). Kokoro no devuelve timings: se
 * estiman con `estimateWordTimings` para alimentar el karaoke.
 */

import type { WordTiming } from "@/domain/ai/llm-port";
import { estimateWordTimings } from "@/domain/tts/word-timings";
import { createWorkerEngineLoader } from "./kokoro-worker-client";

/** Lo mínimo que usamos del RawAudio de transformers.js. */
export interface KokoroAudio {
  /** Segundos de audio. */
  duration: number;
  toBlob(): Blob;
}

export interface KokoroEngine {
  generate(text: string, options: { voice: string }): Promise<KokoroAudio>;
  /** El proceso detrás del motor murió: no sirve más y hay que recargar. */
  isDead?(): boolean;
}

export interface KokoroSpeech {
  audioUrl: string;
  timings: WordTiming[];
}

export type KokoroState = "idle" | "loading" | "ready";

export interface KokoroDeps {
  load(): Promise<KokoroEngine>;
  toUrl(blob: Blob): string;
}

export interface KokoroService {
  state(): KokoroState;
  /** Empieza (o espera) la carga del modelo sin sintetizar nada. */
  warm(): Promise<void>;
  synthesize(text: string, voice: string): Promise<KokoroSpeech>;
}

export function createKokoroService(deps: KokoroDeps): KokoroService {
  let enginePromise: Promise<KokoroEngine> | null = null;
  let current: KokoroEngine | null = null;
  // Cola: el motor procesa una generación a la vez.
  let queue: Promise<unknown> = Promise.resolve();

  const getEngine = (): Promise<KokoroEngine> => {
    if (current?.isDead?.()) reset();
    if (enginePromise) return enginePromise;
    const mine = deps.load().then(
      (engine) => ((current = engine), engine),
      (error) => {
        if (enginePromise === mine) enginePromise = null;
        throw error;
      },
    );
    enginePromise = mine;
    return mine;
  };

  const reset = () => {
    enginePromise = null;
    current = null;
  };

  const state = (): KokoroState => {
    if (current?.isDead?.()) reset();
    return current ? "ready" : enginePromise ? "loading" : "idle";
  };

  const synthesize = (text: string, voice: string): Promise<KokoroSpeech> => {
    const job = queue.then(async () => {
      const engine = await getEngine();
      const raw = await engine.generate(text, { voice });
      return { audioUrl: deps.toUrl(raw.toBlob()), timings: estimateWordTimings(text, raw.duration) };
    });
    queue = job.catch(() => undefined);
    return job;
  };

  return { state, warm: () => getEngine().then(() => undefined), synthesize };
}

/** El worker se empaqueta aparte: `new URL(..., import.meta.url)` es lo que webpack reconoce. */
function spawnKokoroWorker(): Worker {
  return new Worker(new URL("./kokoro.worker.ts", import.meta.url), { type: "module" });
}

const kokoro = createKokoroService({ load: createWorkerEngineLoader(spawnKokoroWorker), toUrl: (blob) => URL.createObjectURL(blob) });

/** ¿Hay runtime para correr Kokoro (renderer con WebAssembly)? */
export function kokoroAvailable(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined" && typeof WebAssembly !== "undefined";
}

export const kokoroState = kokoro.state;
export const warmKokoro = kokoro.warm;
export const synthesizeKokoro = kokoro.synthesize;
