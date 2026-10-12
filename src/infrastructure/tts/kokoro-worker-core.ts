/**
 * Lógica del Web Worker de Kokoro, separada del `self` para probarla sin
 * navegador: recibe mensajes (ya externos, se validan aquí), carga el modelo
 * una sola vez y responde por `post`. El archivo `kokoro.worker.ts` solo la
 * cablea a `self.onmessage` y al import real de kokoro-js.
 */

import { parseWorkerRequest, type WorkerResponse } from "./kokoro-protocol";

export interface WorkerEngine {
  generate(text: string, voice: string): Promise<{ blob: Blob; duration: number }>;
}

export interface WorkerHandlerDeps {
  load(): Promise<WorkerEngine>;
  post(message: WorkerResponse): void;
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function createKokoroWorkerHandler({ load, post }: WorkerHandlerDeps): (data: unknown) => Promise<void> {
  let engine: Promise<WorkerEngine> | null = null;

  const getEngine = (): Promise<WorkerEngine> => {
    if (engine) return engine;
    const mine = load().catch((error) => {
      if (engine === mine) engine = null; // un fallo no deja el worker roto para siempre
      throw error;
    });
    engine = mine;
    return mine;
  };

  return async (data) => {
    const request = parseWorkerRequest(data);
    if (!request) return;
    try {
      const ready = await getEngine();
      if (request.type === "load") return post({ type: "ready", id: request.id });
      const { blob, duration } = await ready.generate(request.text, request.voice);
      post({ type: "audio", id: request.id, blob, duration });
    } catch (error) {
      post({ type: "error", id: request.id, message: messageOf(error) });
    }
  };
}
