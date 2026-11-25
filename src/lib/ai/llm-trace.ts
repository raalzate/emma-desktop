/**
 * Traza de llamadas al LLM (T3 de #323).
 *
 * El "why": diagnosticar que la simulación «se queda pensando» exigió
 * instrumentar el adaptador a mano. Con la traza, cada llamada deja qué fue
 * (tag), cuánto tardó (cola + generación), cuánto pesaba el prompt y cómo
 * terminó. Vive en memoria del renderer: nada sale del equipo. Se lee en la
 * consola de dev como `__emmaTrace.records()` / `__emmaTrace.summary()` y la
 * usa el banco de evaluación (`scripts/eval-simulacion.mjs`).
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";

const PREVIEW_CHARS = 160;

export interface TraceRecord {
  tag: string;
  /** Epoch ms al encolar la llamada. */
  startedAt: number;
  /** Duración total: espera en la cola del motor + generación. */
  ms: number;
  promptChars: number;
  ok: boolean;
  preview: string;
  error?: string;
}

export interface TagSummary {
  count: number;
  failed: number;
  p50: number;
  p95: number;
}

export interface TraceBuffer {
  push(record: TraceRecord): void;
  records(): TraceRecord[];
  summary(): Record<string, TagSummary>;
  clear(): void;
}

function percentile(sorted: number[], p: number): number {
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function createTraceBuffer(limit = 500): TraceBuffer {
  let items: TraceRecord[] = [];
  return {
    push(record) {
      items = [...items, record].slice(-limit);
    },
    records: () => [...items],
    summary() {
      const byTag = new Map<string, TraceRecord[]>();
      for (const r of items) byTag.set(r.tag, [...(byTag.get(r.tag) ?? []), r]);
      const out: Record<string, TagSummary> = {};
      for (const [tag, list] of byTag) {
        const sorted = list.map((r) => r.ms).sort((a, b) => a - b);
        out[tag] = {
          count: list.length,
          failed: list.filter((r) => !r.ok).length,
          p50: percentile(sorted, 50),
          p95: percentile(sorted, 95),
        };
      }
      return out;
    },
    clear() {
      items = [];
    },
  };
}

/** Envuelve un LlmGenerate para que cada llamada deje su registro. */
export function withTrace(llm: LlmGenerate, buffer: TraceBuffer, now: () => number = Date.now): LlmGenerate {
  return async (args) => {
    const startedAt = now();
    const base = { tag: args.tag ?? "other", startedAt, promptChars: args.prompt.length };
    try {
      const out = await llm(args);
      buffer.push({ ...base, ms: now() - startedAt, ok: true, preview: out.slice(0, PREVIEW_CHARS) });
      return out;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      buffer.push({ ...base, ms: now() - startedAt, ok: false, preview: "", error });
      throw err;
    }
  };
}

/** Buffer global del renderer: uno solo aunque se creen varios LlmGenerate. */
export function globalTraceBuffer(): TraceBuffer {
  const g = globalThis as unknown as { __emmaTrace?: TraceBuffer };
  g.__emmaTrace ??= createTraceBuffer();
  return g.__emmaTrace;
}

export const TRACE_FLAG = "emma.trace";

/** En dev siempre; en producción sólo si el usuario activó el flag local. */
export function traceEnabled(nodeEnv: string | undefined, flag: string | null): boolean {
  return nodeEnv !== "production" || flag === "1";
}

function readFlag(): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(TRACE_FLAG);
  } catch {
    return null;
  }
}

/** Envuelve con la traza global si corresponde; si no, devuelve el LLM tal cual. */
export function maybeTrace(llm: LlmGenerate): LlmGenerate {
  return traceEnabled(process.env.NODE_ENV, readFlag()) ? withTrace(llm, globalTraceBuffer()) : llm;
}
