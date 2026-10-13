/**
 * Lado renderer del Web Worker de Kokoro: adapta el worker al puerto
 * `KokoroEngine` (el mismo que usa el servicio). Cada petición lleva un id y se
 * resuelve con la respuesta que lo nombra; si el worker cae, todo lo pendiente
 * rechaza y el motor queda marcado como muerto para que el servicio recargue.
 */

import type { KokoroAudio, KokoroEngine } from "./kokoro-tts";
import { parseWorkerResponse, type WorkerResponse } from "./kokoro-protocol";

/** Lo mínimo que usamos de `Worker`; permite inyectar un falso en pruebas. */
export interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

interface Pending {
  resolve(response: WorkerResponse): void;
  reject(error: Error): void;
}

const DEAD_WORKER = "El worker de Kokoro se detuvo";

export function createWorkerEngineLoader(spawn: () => WorkerLike): () => Promise<KokoroEngine> {
  return () => {
    const worker = spawn();
    const pending = new Map<number, Pending>();
    let nextId = 0;
    let dead = false;

    const die = (reason: string) => {
      if (dead) return;
      dead = true;
      worker.terminate();
      for (const p of pending.values()) p.reject(new Error(`${DEAD_WORKER}: ${reason}`));
      pending.clear();
    };

    worker.onmessage = ({ data }) => {
      const response = parseWorkerResponse(data);
      if (!response) return;
      const entry = pending.get(response.id);
      if (!entry) return;
      pending.delete(response.id);
      if (response.type === "error") entry.reject(new Error(response.message));
      else entry.resolve(response);
    };
    worker.onerror = (event) => {
      die(typeof event?.message === "string" ? event.message : "error sin detalle");
    };

    const request = (message: { type: "load" } | { type: "generate"; text: string; voice: string }) =>
      new Promise<WorkerResponse>((resolve, reject) => {
        if (dead) return reject(new Error(DEAD_WORKER));
        const id = nextId++;
        pending.set(id, { resolve, reject });
        worker.postMessage({ ...message, id });
      });

    const engine: KokoroEngine = {
      isDead: () => dead,
      async generate(text, { voice }): Promise<KokoroAudio> {
        const response = await request({ type: "generate", text, voice });
        if (response.type !== "audio") throw new Error("Respuesta inesperada del worker de Kokoro");
        return { duration: response.duration, toBlob: () => response.blob };
      },
    };

    return request({ type: "load" }).then(
      () => engine,
      (error) => {
        die("la carga falló");
        throw error;
      },
    );
  };
}
