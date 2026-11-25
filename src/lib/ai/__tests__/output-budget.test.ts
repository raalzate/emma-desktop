/**
 * Tope de salida del motor local (#323): `runLocalTurn` no le pasaba `maxTokens`
 * a LiteRT, así que ningún tope del puerto se respetaba en local (el clasificador
 * pedía 80 tokens y podía generar cientos). Se aproxima en caracteres.
 */
import { describe, expect, it } from "vitest";
import { outputBudgetReached, CHARS_PER_TOKEN } from "../output-budget";

describe("outputBudgetReached", () => {
  it("sin tope nunca corta", () => {
    expect(outputBudgetReached("x".repeat(10_000), undefined)).toBe(false);
  });

  it("corta al alcanzar maxTokens × caracteres por token", () => {
    expect(outputBudgetReached("x".repeat(80 * CHARS_PER_TOKEN - 1), 80)).toBe(false);
    expect(outputBudgetReached("x".repeat(80 * CHARS_PER_TOKEN), 80)).toBe(true);
  });

  it("un tope inválido no corta (entrada del puerto)", () => {
    expect(outputBudgetReached("x".repeat(100), 0)).toBe(false);
    expect(outputBudgetReached("x".repeat(100), Number.NaN)).toBe(false);
  });
});

describe("cableado del tope en el motor local", () => {
  it("el adaptador le pasa maxTokens a LiteRT y el bucle lo aplica", async () => {
    const fs = await import("node:fs");
    expect(fs.readFileSync("src/lib/ai/llm-adapter.ts", "utf8")).toMatch(/maxTokens: enforcedMaxTokens\(args\.tag, args\.maxTokens\)/);
    expect(fs.readFileSync("src/lib/ai/litert-engine.ts", "utf8")).toMatch(/outputBudgetReached\(full, maxTokens\)/);
  });
});

describe("enforcedMaxTokens", () => {
  it("aplica el tope sólo a las llamadas medidas del turno", async () => {
    const { enforcedMaxTokens } = await import("../output-budget");
    expect(enforcedMaxTokens("chat", 160)).toBe(160);
    expect(enforcedMaxTokens("observe", 80)).toBe(80);
    expect(enforcedMaxTokens("lesson", 380)).toBeUndefined();
    expect(enforcedMaxTokens(undefined, 380)).toBeUndefined();
  });
});
