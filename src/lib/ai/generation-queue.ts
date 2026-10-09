/**
 * Planificador de generaciones LOCALES. La GPU atiende una sola generación a la
 * vez, así que serializamos: la siguiente en salir es la interactiva más antigua
 * antes que cualquier background (FIFO dentro de cada prioridad). Si llega una
 * interactiva mientras corre una background, se preempta (su signal se aborta y
 * rechaza; no se reintenta). Lógica pura: sin WebGPU, testeable con fakes.
 */

import type { GenerationPriority } from "@/domain/ai/llm-port";

export interface QueueJob<T> {
  priority: GenerationPriority;
  /** Cancelación externa (el que pidió la generación ya no la quiere). */
  signal?: AbortSignal;
  /** Debe rechazar (idealmente con AbortError) cuando el signal recibido se aborte. */
  run: (signal: AbortSignal) => Promise<T>;
}

export function abortError(): Error {
  const err = new Error("Generation aborted");
  err.name = "AbortError";
  return err;
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

interface Entry {
  job: QueueJob<unknown>;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  onAbort?: () => void;
}

export interface GenerationQueue {
  enqueue<T>(job: QueueJob<T>): Promise<T>;
}

export function createGenerationQueue(): GenerationQueue {
  const waiting: Entry[] = [];
  let running: { priority: GenerationPriority; controller: AbortController } | null = null;

  const detach = (e: Entry) => e.job.signal?.removeEventListener("abort", e.onAbort as () => void);

  /** Interactiva más antigua primero; si no hay, la background más antigua. */
  function takeNext(): Entry | undefined {
    const i = waiting.findIndex((e) => e.job.priority === "interactive");
    return waiting.splice(i >= 0 ? i : 0, 1)[0];
  }

  async function pump(): Promise<void> {
    if (running) return;
    const entry = takeNext();
    if (!entry) return;
    detach(entry);
    const controller = new AbortController();
    running = { priority: entry.job.priority, controller };
    const external = entry.job.signal;
    const forward = () => controller.abort();
    external?.addEventListener("abort", forward);
    try {
      entry.resolve(await entry.job.run(controller.signal));
    } catch (err) {
      entry.reject(err);
    } finally {
      external?.removeEventListener("abort", forward);
      running = null;
      void pump();
    }
  }

  return {
    enqueue<T>(job: QueueJob<T>): Promise<T> {
      if (job.signal?.aborted) return Promise.reject(abortError());
      return new Promise<T>((resolve, reject) => {
        const entry: Entry = { job, resolve: resolve as (v: unknown) => void, reject };
        entry.onAbort = () => {
          const i = waiting.indexOf(entry);
          if (i < 0) return;
          waiting.splice(i, 1);
          reject(abortError());
        };
        job.signal?.addEventListener("abort", entry.onAbort);
        waiting.push(entry);
        // Preempción: la interactiva no espera a una background en curso.
        if (job.priority === "interactive" && running?.priority === "background") {
          running.controller.abort();
        }
        void pump();
      });
    },
  };
}
