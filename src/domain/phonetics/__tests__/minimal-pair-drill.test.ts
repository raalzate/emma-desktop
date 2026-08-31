/**
 * Pruebas del protocolo perceptivo de pares mínimos (§1.3): se presenta UNA
 * palabra del par y el aprendiz decide cuál oyó (Best & Tyler).
 */
import { describe, it, expect } from "vitest";
import {
  buildPerceptionRound,
  checkPerception,
  scoreRound,
  type PerceptionItem,
} from "@/domain/phonetics/minimal-pair-drill";
import type { SoundContrast } from "@/domain/phonetics/phonetics";
import { SOUND_CONTRASTS } from "@/lib/phonetics-data";

const contrasteSimple: SoundContrast = {
  id: "test-contrast",
  titleEs: "Contraste de prueba",
  phonemes: ["ɪ", "iː"],
  explanationEs: "explicación",
  pairs: [
    { a: "live", b: "leave" },
    { a: "bit", b: "beat" },
    { a: "sit", b: "seat" },
  ],
};

describe("buildPerceptionRound", () => {
  it("es determinista: misma semilla produce la misma ronda", () => {
    const rondaA = buildPerceptionRound(contrasteSimple, 5, 42);
    const rondaB = buildPerceptionRound(contrasteSimple, 5, 42);
    expect(rondaA).toEqual(rondaB);
  });

  it("semillas distintas producen rondas distintas", () => {
    const rondaA = buildPerceptionRound(contrasteSimple, 5, 1);
    const rondaB = buildPerceptionRound(contrasteSimple, 5, 2);
    expect(rondaA).not.toEqual(rondaB);
  });

  it("genera items con las dos opciones del par y answerIndex válido", () => {
    const ronda = buildPerceptionRound(contrasteSimple, 3, 7);
    for (const item of ronda) {
      expect(item.options).toHaveLength(2);
      expect([0, 1]).toContain(item.answerIndex);
      expect(item.options[item.answerIndex]).toBe(item.prompt);
    }
  });

  it("con semilla fija, ambas opciones aparecen como respuesta en una ronda larga", () => {
    const ronda = buildPerceptionRound(contrasteSimple, 20, 99);
    const indices = new Set(ronda.map((item) => item.answerIndex));
    expect(indices.has(0)).toBe(true);
    expect(indices.has(1)).toBe(true);
  });

  it("cicla los pares cuando size supera el número de pares disponibles", () => {
    const ronda = buildPerceptionRound(contrasteSimple, 7, 3);
    expect(ronda).toHaveLength(7);
    // Cada prompt debe pertenecer a alguno de los 3 pares originales
    const prompts = ronda.map((item) => item.prompt);
    const palabrasValidas = new Set(
      contrasteSimple.pairs.flatMap((par) => [par.a, par.b]),
    );
    for (const prompt of prompts) {
      expect(palabrasValidas.has(prompt)).toBe(true);
    }
  });

  it("lanza error si el contraste no tiene pares", () => {
    const vacio: SoundContrast = { ...contrasteSimple, pairs: [] };
    expect(() => buildPerceptionRound(vacio, 3, 1)).toThrow();
  });

  it("lanza error si size es menor o igual a cero", () => {
    expect(() => buildPerceptionRound(contrasteSimple, 0, 1)).toThrow();
    expect(() => buildPerceptionRound(contrasteSimple, -1, 1)).toThrow();
  });

  it("filtra pares del atlas IPA: todos sus pares tienen símbolo IPA en `a`, así que no quedan pares pronunciables", () => {
    // El atlas de vocales (§1.2) representa cada vocal con `a` = símbolo IPA
    // (p. ej. "/iː/"), por lo que ninguno de sus pares sirve para el
    // protocolo perceptivo de percepción de palabras.
    const atlas = SOUND_CONTRASTS.find((c) => c.id === "vowel-atlas");
    expect(atlas).toBeDefined();
    expect(() => buildPerceptionRound(atlas as SoundContrast, 5, 3)).toThrow();
  });

  it("filtra pares individuales con IPA dejando solo los pronunciables del mismo contraste", () => {
    const mixto: SoundContrast = {
      ...contrasteSimple,
      pairs: [
        { a: "/iː/", b: "release" },
        { a: "live", b: "leave" },
      ],
    };
    const ronda = buildPerceptionRound(mixto, 4, 5);
    for (const item of ronda) {
      expect(["live", "leave"]).toContain(item.prompt);
    }
  });

  it("integra con SOUND_CONTRASTS real usando un contraste con pares pronunciables", () => {
    const contrasteReal = SOUND_CONTRASTS.find((c) => c.id === "i-vs-ii");
    expect(contrasteReal).toBeDefined();
    const ronda = buildPerceptionRound(contrasteReal as SoundContrast, 4, 10);
    expect(ronda).toHaveLength(4);
  });
});

describe("checkPerception", () => {
  it("devuelve true cuando el índice elegido coincide con la respuesta", () => {
    const item: PerceptionItem = {
      prompt: "leave",
      options: ["live", "leave"],
      answerIndex: 1,
    };
    expect(checkPerception(item, 1)).toBe(true);
  });

  it("devuelve false cuando el índice elegido no coincide", () => {
    const item: PerceptionItem = {
      prompt: "live",
      options: ["live", "leave"],
      answerIndex: 0,
    };
    expect(checkPerception(item, 1)).toBe(false);
  });
});

describe("scoreRound", () => {
  it("calcula total, correctas y pares débiles a partir de respuestas", () => {
    const items: PerceptionItem[] = [
      { prompt: "live", options: ["live", "leave"], answerIndex: 0 },
      { prompt: "beat", options: ["bit", "beat"], answerIndex: 1 },
      { prompt: "seat", options: ["sit", "seat"], answerIndex: 1 },
    ];
    const resultado = scoreRound(items, [0, 1, 0]);
    expect(resultado.total).toBe(3);
    expect(resultado.correct).toBe(2);
    expect(resultado.weakPairs).toEqual(["seat"]);
  });

  it("lanza error si la longitud de respuestas no coincide con la de items", () => {
    const items: PerceptionItem[] = [
      { prompt: "live", options: ["live", "leave"], answerIndex: 0 },
    ];
    expect(() => scoreRound(items, [0, 1])).toThrow();
  });
});
