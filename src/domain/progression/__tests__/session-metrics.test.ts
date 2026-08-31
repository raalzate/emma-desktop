/**
 * Pruebas de computeSessionMetrics/metricLevels: las tres métricas del libro
 * medibles con lo que ya guardamos (latencia, monólogo, densidad de error).
 */

import { describe, it, expect } from "vitest";
import type { ChatTurn } from "@/domain/chat/simulation-session";
import type { SilentError } from "@/domain/chat/silent-error";
import { computeSessionMetrics, metricLevels } from "../session-metrics";

function turn(role: ChatTurn["role"], content: string, at: number): ChatTurn {
  return { role, content, at };
}

function error(): SilentError {
  return { label: "grammar", original: "I go yesterday", corrected: "I went yesterday" };
}

describe("computeSessionMetrics", () => {
  it("calcula la mediana de latencia entre turno de EMMA y respuesta del aprendiz", () => {
    const messages: ChatTurn[] = [
      turn("assistant", "Hi, how are you?", 0),
      turn("user", "I am fine thanks", 2_000), // 2s
      turn("assistant", "Great, tell me more", 2_500),
      turn("user", "I work as an engineer", 12_500), // 10s
      turn("assistant", "Nice, since when?", 13_000),
      turn("user", "Since 2020", 19_000), // 6s
    ];
    const result = computeSessionMetrics({ messages, errors: [], at: 100_000 });

    // mediana de [2, 10, 6] = 6 (un despiste de 10s no domina el resultado)
    expect(result.responseLatencySeconds).toBe(6);
  });

  it("ignora el despiste de un solo turno lento gracias a la mediana (no a la media)", () => {
    const messages: ChatTurn[] = [
      turn("assistant", "Question one", 0),
      turn("user", "Answer one", 1_000), // 1s
      turn("assistant", "Question two", 1_500),
      turn("user", "Answer two", 2_500), // 1s
      turn("assistant", "Question three", 3_000),
      turn("user", "Answer three, sorry got distracted", 63_000), // 60s: despiste
    ];
    const result = computeSessionMetrics({ messages, errors: [], at: 100_000 });

    // mediana de [1, 1, 60] = 1; la media sería ~20.7 y ocultaría el resto
    expect(result.responseLatencySeconds).toBe(1);
  });

  it("devuelve latencia 0 cuando no hay pares EMMA→aprendiz", () => {
    const messages: ChatTurn[] = [turn("user", "Hello alone", 0)];
    const result = computeSessionMetrics({ messages, errors: [], at: 100_000 });

    expect(result.responseLatencySeconds).toBe(0);
  });

  it("ignora turnos sin marca de tiempo al calcular la latencia", () => {
    const messages: ChatTurn[] = [
      { role: "assistant", content: "Hi" }, // sin `at`
      turn("user", "Hello there", 1_000),
      turn("assistant", "How's work?", 1_000),
      turn("user", "Busy but good", 4_000), // 3s: único par válido
    ];
    const result = computeSessionMetrics({ messages, errors: [], at: 100_000 });

    expect(result.responseLatencySeconds).toBe(3);
  });

  it("calcula el monólogo sostenido como las palabras del turno más largo del aprendiz", () => {
    const messages: ChatTurn[] = [
      turn("assistant", "Tell me about your project", 0),
      turn("user", "It is a small project", 1_000), // 5 palabras
      turn("assistant", "Go on", 2_000),
      turn("user", "We use TypeScript and React for the frontend and Node for the backend", 3_000), // 13 palabras
    ];
    const result = computeSessionMetrics({ messages, errors: [], at: 100_000 });

    expect(result.longestMonologueWords).toBe(13);
  });

  it("calcula la densidad de error por 100 palabras del aprendiz", () => {
    const messages: ChatTurn[] = [
      turn("user", "I go to work yesterday", 0), // 5 palabras
      turn("user", "I has one question", 1_000), // 4 palabras
    ];
    const result = computeSessionMetrics({ messages, errors: [error(), error()], at: 100_000 });

    // 2 errores / 9 palabras * 100 = 22.22...
    expect(result.errorDensityPer100Words).toBeCloseTo(22.222, 2);
  });

  it("devuelve densidad de error 0 cuando el aprendiz no escribió palabras", () => {
    const messages: ChatTurn[] = [turn("assistant", "Hello", 0)];
    const result = computeSessionMetrics({ messages, errors: [error()], at: 100_000 });

    expect(result.errorDensityPer100Words).toBe(0);
  });

  it("cuenta los turnos del aprendiz y conserva el `at` de cierre recibido", () => {
    const messages: ChatTurn[] = [
      turn("assistant", "Hi", 0),
      turn("user", "Hello", 1_000),
      turn("user", "Again", 2_000),
    ];
    const result = computeSessionMetrics({ messages, errors: [], at: 999 });

    expect(result.turns).toBe(2);
    expect(result.at).toBe(999);
  });

  it("no falla con lista de mensajes vacía", () => {
    const result = computeSessionMetrics({ messages: [], errors: [], at: 0 });

    expect(result).toEqual({
      responseLatencySeconds: 0,
      longestMonologueWords: 0,
      errorDensityPer100Words: 0,
      turns: 0,
      at: 0,
    });
  });

  it("no falla con un único turno", () => {
    const messages: ChatTurn[] = [turn("user", "Just one message", 0)];
    const result = computeSessionMetrics({ messages, errors: [], at: 0 });

    expect(result.responseLatencySeconds).toBe(0);
    expect(result.longestMonologueWords).toBe(3);
  });
});

describe("metricLevels", () => {
  it("mapea cada métrica de sesión a su nivel MCER usando los umbrales del libro", () => {
    const levels = metricLevels({
      responseLatencySeconds: 1.5, // <2 → B2
      longestMonologueWords: 6, // >=5 → B2 (tratado como proxy de minutos)
      errorDensityPer100Words: 20, // >15 → A1
      turns: 4,
      at: 0,
    });

    expect(levels["response-latency"]).toBe("B2");
    expect(levels["sustained-monologue"]).toBe("B2");
    expect(levels["error-density"]).toBe("A1");
  });
});
