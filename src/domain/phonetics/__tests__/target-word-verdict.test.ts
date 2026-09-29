/**
 * H8: "Say it" ahora pide leer una oración completa, pero el veredicto que
 * importa es si la MÁQUINA reconoció la palabra objetivo dentro de esa
 * oración — más el porcentaje general de inteligibilidad de la frase.
 */
import { describe, it, expect } from "vitest";
import { checkTargetWordInSentence } from "../pronunciation-check";

describe("checkTargetWordInSentence", () => {
  it("marca la palabra objetivo como entendida cuando aparece igual en la transcripción", () => {
    const v = checkTargetWordInSentence("Wait a bit.", "bit", "wait a bit");
    expect(v.targetOk).toBe(true);
    expect(v.targetHeard).toBe("bit");
    expect(v.overall.score).toBe(1);
  });

  it("marca la palabra objetivo como no entendida cuando el ASR oyó otra cosa en su lugar", () => {
    const v = checkTargetWordInSentence("Wait a bit.", "bit", "wait a beat");
    expect(v.targetOk).toBe(false);
    expect(v.targetHeard).toBe("beat");
  });

  it("marca la palabra objetivo como no oída cuando la transcripción está vacía", () => {
    const v = checkTargetWordInSentence("Wait a bit.", "bit", "");
    expect(v.targetOk).toBe(false);
    expect(v.targetHeard).toBeNull();
    expect(v.overall.score).toBe(0);
  });

  it("localiza la palabra objetivo aunque no sea la primera de la oración", () => {
    const v = checkTargetWordInSentence(
      "Our team beat the deadline.",
      "beat",
      "our team beat the deadline",
    );
    expect(v.targetOk).toBe(true);
    expect(v.targetWord).toBe("beat");
  });

  it("lanza si la palabra objetivo no aparece en la oración (error de programación)", () => {
    expect(() => checkTargetWordInSentence("Wait a bit.", "beat", "wait a bit")).toThrow();
  });
});
