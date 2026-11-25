/**
 * Traza de llamadas al LLM (T3 de #323): sin ella, diagnosticar «se queda
 * pensando» exigió instrumentar a mano. Cada llamada deja tipo (tag), duración,
 * tamaño del prompt, vista previa de la salida y si terminó o falló.
 */

import { describe, expect, it } from "vitest";
import { createTraceBuffer, withTrace } from "../llm-trace";
import type { LlmGenerate } from "@/domain/ai/llm-port";

function clock(times: number[]) {
  let i = 0;
  return () => times[Math.min(i++, times.length - 1)];
}

describe("withTrace", () => {
  it("registra tag, duración, tamaño y vista previa de una llamada exitosa", async () => {
    const buffer = createTraceBuffer(10);
    const llm: LlmGenerate = async () => "Hi Raul, what did you do yesterday?";
    const traced = withTrace(llm, buffer, clock([1000, 1850]));
    const out = await traced({ prompt: "x".repeat(40), tag: "chat" });
    expect(out).toBe("Hi Raul, what did you do yesterday?");
    expect(buffer.records()).toEqual([
      expect.objectContaining({ tag: "chat", ms: 850, promptChars: 40, ok: true, preview: out }),
    ]);
  });

  it("una llamada sin tag queda como «other»", async () => {
    const buffer = createTraceBuffer(10);
    await withTrace(async () => "OK", buffer, clock([0, 1]))({ prompt: "p" });
    expect(buffer.records()[0].tag).toBe("other");
  });

  it("registra el fallo (p. ej. aborto) y relanza el error", async () => {
    const buffer = createTraceBuffer(10);
    const llm: LlmGenerate = async () => {
      throw new Error("Generation aborted");
    };
    await expect(withTrace(llm, buffer, clock([0, 5]))({ prompt: "p", tag: "judge" })).rejects.toThrow(
      "Generation aborted",
    );
    expect(buffer.records()[0]).toMatchObject({ tag: "judge", ok: false, error: "Generation aborted", ms: 5 });
  });

  it("la vista previa se recorta y el buffer conserva sólo las últimas N", async () => {
    const buffer = createTraceBuffer(2);
    const llm: LlmGenerate = async () => "a".repeat(500);
    const traced = withTrace(llm, buffer, clock([0, 1]));
    await traced({ prompt: "1", tag: "t1" });
    await traced({ prompt: "2", tag: "t2" });
    await traced({ prompt: "3", tag: "t3" });
    expect(buffer.records().map((r) => r.tag)).toEqual(["t2", "t3"]);
    expect(buffer.records()[0].preview.length).toBeLessThanOrEqual(160);
  });

  it("summary agrupa por tag con conteo y latencia p50/p95", async () => {
    const buffer = createTraceBuffer(50);
    const times = [0, 100, 0, 200, 0, 300, 0, 50];
    const traced = withTrace(async () => "ok", buffer, clock(times));
    for (const tag of ["chat", "chat", "chat", "observe"]) await traced({ prompt: "p", tag });
    expect(buffer.summary()).toEqual({
      chat: { count: 3, failed: 0, p50: 200, p95: 300 },
      observe: { count: 1, failed: 0, p50: 50, p95: 50 },
    });
  });
});

describe("traceEnabled", () => {
  it("en desarrollo siempre; en producción sólo con el flag local", async () => {
    const { traceEnabled } = await import("../llm-trace");
    expect(traceEnabled("development", null)).toBe(true);
    expect(traceEnabled("production", null)).toBe(false);
    expect(traceEnabled("production", "1")).toBe(true);
    expect(traceEnabled("production", "0")).toBe(false);
  });
});
