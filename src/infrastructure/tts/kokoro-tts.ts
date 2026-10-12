/**
 * Voz neuronal local con Kokoro-82M (kokoro-js sobre transformers.js), la caída
 * de Edge-TTS. Corre en el renderer como Whisper: import dinámico (no se carga
 * hasta el primer uso), WebGPU si existe y WASM si no, fp32. El modelo
 * (~326 MB) se descarga una vez y queda en la caché del navegador.
 *
 * El motor es un singleton con reset si la carga falla (un fallo de red no
 * deja el módulo roto para siempre). Kokoro no devuelve timings: se estiman
 * con `estimateWordTimings` para alimentar el karaoke.
 */

import type { WordTiming } from "@/domain/ai/llm-port";
import type { KokoroTTS } from "kokoro-js";
import { estimateWordTimings } from "@/domain/tts/word-timings";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

/** Lo mínimo que usamos del RawAudio de transformers.js. */
export interface KokoroAudio {
  audio: Float32Array;
  sampling_rate: number;
  toBlob(): Blob;
}

export interface KokoroEngine {
  generate(text: string, options: { voice: string }): Promise<KokoroAudio>;
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

export function pickDevice(nav: { gpu?: unknown } | undefined): "webgpu" | "wasm" {
  return nav?.gpu ? "webgpu" : "wasm";
}

export function createKokoroService(deps: KokoroDeps): KokoroService {
  let enginePromise: Promise<KokoroEngine> | null = null;
  let loaded = false;
  // Cola: el motor procesa una generación a la vez.
  let queue: Promise<unknown> = Promise.resolve();

  const getEngine = (): Promise<KokoroEngine> => {
    if (enginePromise) return enginePromise;
    const mine = deps.load().then(
      (engine) => ((loaded = true), engine),
      (error) => {
        if (enginePromise === mine) enginePromise = null;
        throw error;
      },
    );
    enginePromise = mine;
    return mine;
  };

  const state = (): KokoroState => (loaded ? "ready" : enginePromise ? "loading" : "idle");

  const synthesize = (text: string, voice: string): Promise<KokoroSpeech> => {
    const job = queue.then(async () => {
      const engine = await getEngine();
      const raw = await engine.generate(text, { voice });
      const duration = raw.audio.length / raw.sampling_rate;
      return { audioUrl: deps.toUrl(raw.toBlob()), timings: estimateWordTimings(text, duration) };
    });
    queue = job.catch(() => undefined);
    return job;
  };

  return { state, warm: () => getEngine().then(() => undefined), synthesize };
}

type KokoroVoiceId = NonNullable<NonNullable<Parameters<KokoroTTS["generate"]>[1]>["voice"]>;

/** Carga real: import dinámico para que el runtime pesado no entre al bundle inicial. */
async function loadKokoro(): Promise<KokoroEngine> {
  const { KokoroTTS } = await import("kokoro-js");
  const device = pickDevice(typeof navigator === "undefined" ? undefined : (navigator as { gpu?: unknown }));
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "fp32", device });
  return {
    generate: (text, { voice }) =>
      tts.generate(text, { voice: voice as KokoroVoiceId }),
  };
}

const kokoro = createKokoroService({ load: loadKokoro, toUrl: (blob) => URL.createObjectURL(blob) });

/** ¿Hay runtime para correr Kokoro (renderer con WebAssembly)? */
export function kokoroAvailable(): boolean {
  return typeof window !== "undefined" && typeof WebAssembly !== "undefined";
}

export const kokoroState = kokoro.state;
export const warmKokoro = kokoro.warm;
export const synthesizeKokoro = kokoro.synthesize;
