/**
 * Web Worker de Kokoro-82M: corre el modelo con WASM (CPU), nunca WebGPU, para
 * no competir con Gemma (LiteRT en WebGPU) por la memoria de la GPU ni bloquear
 * el hilo de la UI (#245: con Gemma cargada, WebGPU tardaba 2-16 s al primer
 * sonido y la app llegó a cerrarse al crear la sesión ONNX).
 *
 * dtype fp32 por medición en WASM (Chromium, 1 hilo): fp32 ~1,6 s de cómputo por
 * s de audio contra ~2,2 de q8; con hilos (aislamiento) 0,5 contra 1,0. q8 baja la
 * descarga (~92 MB contra 326 MB) pero es MÁS lento en WASM, así que se descarta.
 * La lógica vive en `kokoro-worker-core.ts`; aquí solo se cablea al `self`.
 */

import { createKokoroWorkerHandler, type WorkerEngine } from "./kokoro-worker-core";
import type { WorkerResponse } from "./kokoro-protocol";
import type { KokoroTTS } from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

type KokoroVoiceId = NonNullable<NonNullable<Parameters<KokoroTTS["generate"]>[1]>["voice"]>;

/** Lo mínimo del scope del worker (evita añadir la lib `webworker` a todo el tsconfig). */
interface WorkerScope {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage(message: WorkerResponse): void;
}

async function loadEngine(): Promise<WorkerEngine> {
  const { KokoroTTS } = await import("kokoro-js");
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "fp32", device: "wasm" });
  return {
    async generate(text, voice) {
      const raw = await tts.generate(text, { voice: voice as KokoroVoiceId });
      return { blob: raw.toBlob(), duration: raw.audio.length / raw.sampling_rate };
    },
  };
}

const scope = self as unknown as WorkerScope;
const handle = createKokoroWorkerHandler({ load: loadEngine, post: (message) => scope.postMessage(message) });
scope.onmessage = (event) => void handle(event.data);
