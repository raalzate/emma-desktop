/**
 * Pruebas de integridad de los datos fonéticos de la Parte 1
 * (El sistema de sonidos) transcritos en `@/lib/phonetics-data`.
 */

import { describe, expect, it } from "vitest";

import type {
  PronunciationRule,
  SoundContrast,
} from "@/domain/phonetics/phonetics";
import {
  CONNECTED_SPEECH,
  ED_ENDINGS,
  FINAL_CLUSTERS,
  INTONATION_PATTERNS,
  PART1_CHALLENGES,
  S_ENDINGS,
  SCHWA_WEAK_FORMS,
  SHADOWING_PROTOCOL,
  SOUND_CONTRASTS,
  WORD_STRESS_RULES,
} from "@/lib/phonetics-data";

function expectRuleIntegra(rule: PronunciationRule): void {
  expect(rule.id.trim()).not.toBe("");
  expect(rule.titleEs.trim()).not.toBe("");
  expect(rule.ruleEs.trim()).not.toBe("");
  expect(rule.examples.length).toBeGreaterThan(0);
  for (const example of rule.examples) {
    expect(example.word.trim()).not.toBe("");
  }
}

function expectContrasteIntegro(contrast: SoundContrast): void {
  expect(contrast.id.trim()).not.toBe("");
  expect(contrast.titleEs.trim()).not.toBe("");
  expect(contrast.explanationEs.trim()).not.toBe("");
  expect(contrast.phonemes.length).toBeGreaterThan(0);
  expect(contrast.pairs.length).toBeGreaterThan(0);
  for (const pair of contrast.pairs) {
    expect(pair.a.trim()).not.toBe("");
    expect(pair.b.trim()).not.toBe("");
  }
}

describe("SOUND_CONTRASTS (1.2 y 1.3)", () => {
  it("incluye al menos 11 contrastes de sonido", () => {
    expect(SOUND_CONTRASTS.length).toBeGreaterThanOrEqual(11);
  });

  it("tiene ids únicos y campos no vacíos en todos los contrastes", () => {
    const ids = SOUND_CONTRASTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const contrast of SOUND_CONTRASTS) {
      expectContrasteIntegro(contrast);
    }
  });

  it("incluye el atlas de vocales con las 16 vocales (11 simples + 5 diptongos)", () => {
    const atlas = SOUND_CONTRASTS.find((c) => c.id === "vowel-atlas");
    expect(atlas).toBeDefined();
    expect(atlas?.pairs.length).toBe(16);
    expect(atlas?.phonemes).toContain("ə");
    expect(atlas?.phonemes).toContain("oʊ");
  });

  it("el contraste /ɪ/ vs /iː/ tiene al menos 10 pares mínimos", () => {
    const contraste = SOUND_CONTRASTS.find(
      (c) => c.phonemes.includes("ɪ") && c.phonemes.includes("iː"),
    );
    expect(contraste).toBeDefined();
    expect(contraste?.pairs.length).toBeGreaterThanOrEqual(10);
  });

  it("cubre los 11 contrastes de la sección 1.3", () => {
    const esperados = [
      "i-vs-ii",
      "ae-e-uh",
      "b-vs-v",
      "s-inicial",
      "th-sordo-sonoro",
      "z-sonora",
      "sh-vs-ch",
      "j-vs-y",
      "h-aspirada",
      "ng-final",
      "r-l",
    ];
    const ids = SOUND_CONTRASTS.map((c) => c.id);
    for (const id of esperados) {
      expect(ids).toContain(id);
    }
  });
});

describe("FINAL_CLUSTERS (1.4)", () => {
  it("es una regla íntegra con los grupos consonánticos difíciles", () => {
    expectRuleIntegra(FINAL_CLUSTERS);
    const palabras = FINAL_CLUSTERS.examples.map((e) => e.word);
    expect(palabras).toContain("tests");
    expect(palabras).toContain("strengths");
  });
});

describe("ED_ENDINGS (1.5)", () => {
  it("tiene exactamente 3 reglas: /ɪd/, /t/ y /d/", () => {
    expect(ED_ENDINGS.length).toBe(3);
    expect(ED_ENDINGS.map((r) => r.id)).toEqual(["ed-id", "ed-t", "ed-d"]);
  });

  it("cada regla es íntegra y con ejemplos", () => {
    for (const rule of ED_ENDINGS) {
      expectRuleIntegra(rule);
    }
  });
});

describe("S_ENDINGS (1.6)", () => {
  it("tiene exactamente 3 reglas: /ɪz/, /s/ y /z/", () => {
    expect(S_ENDINGS.length).toBe(3);
    expect(S_ENDINGS.map((r) => r.id)).toEqual(["s-iz", "s-s", "s-z"]);
  });

  it("cada regla es íntegra y con ejemplos", () => {
    for (const rule of S_ENDINGS) {
      expectRuleIntegra(rule);
    }
  });
});

describe("WORD_STRESS_RULES (1.7)", () => {
  it("incluye cognados, palabras engañosas y las 4 reglas de acento", () => {
    expect(WORD_STRESS_RULES.length).toBe(6);
    for (const rule of WORD_STRESS_RULES) {
      expectRuleIntegra(rule);
    }
  });

  it("las palabras engañosas incluyen IPA", () => {
    const enganosas = WORD_STRESS_RULES.find(
      (r) => r.id === "stress-enganosas",
    );
    expect(enganosas).toBeDefined();
    for (const example of enganosas?.examples ?? []) {
      expect(example.ipa?.trim()).toBeTruthy();
    }
  });
});

describe("SCHWA_WEAK_FORMS (1.8)", () => {
  it("es una regla íntegra con las formas débiles habituales", () => {
    expectRuleIntegra(SCHWA_WEAK_FORMS);
    const palabras = SCHWA_WEAK_FORMS.examples.map((e) => e.word);
    expect(palabras).toContain("and");
    expect(palabras).toContain("the");
  });
});

describe("CONNECTED_SPEECH (1.9)", () => {
  it("cubre linking, flapping, elisión, asimilación y la frase integral", () => {
    expect(CONNECTED_SPEECH.map((r) => r.id)).toEqual([
      "cs-linking",
      "cs-flapping",
      "cs-elision",
      "cs-asimilacion",
      "cs-frase-integral",
    ]);
    for (const rule of CONNECTED_SPEECH) {
      expectRuleIntegra(rule);
    }
  });
});

describe("INTONATION_PATTERNS (1.10)", () => {
  it("cubre descendente, ascendente, discrepancia cortés y sentence stress", () => {
    expect(INTONATION_PATTERNS.length).toBe(4);
    for (const rule of INTONATION_PATTERNS) {
      expectRuleIntegra(rule);
    }
  });

  it("la discrepancia cortés tiene 4 pasos", () => {
    const discrepancia = INTONATION_PATTERNS.find(
      (r) => r.id === "int-discrepancia-cortes",
    );
    expect(discrepancia?.examples.length).toBe(4);
  });

  it("el sentence stress tiene los 6 énfasis de la frase base", () => {
    const stress = INTONATION_PATTERNS.find(
      (r) => r.id === "int-sentence-stress",
    );
    expect(stress?.examples.length).toBe(6);
  });
});

describe("SHADOWING_PROTOCOL (1.11)", () => {
  it("tiene 6 fases ordenadas que suman 10 minutos", () => {
    expect(SHADOWING_PROTOCOL.length).toBe(6);
    expect(SHADOWING_PROTOCOL.map((f) => f.order)).toEqual([1, 2, 3, 4, 5, 6]);
    const total = SHADOWING_PROTOCOL.reduce((sum, f) => sum + f.minutes, 0);
    expect(total).toBe(10);
  });

  it("cada fase tiene nombre y acción no vacíos", () => {
    for (const fase of SHADOWING_PROTOCOL) {
      expect(fase.nameEs.trim()).not.toBe("");
      expect(fase.actionEs.trim()).not.toBe("");
      expect(fase.minutes).toBeGreaterThan(0);
    }
  });
});

describe("PART1_CHALLENGES (1.12)", () => {
  it("incluye los retos A, B y C con instrucciones no vacías", () => {
    expect(PART1_CHALLENGES.map((c) => c.id)).toEqual(["A", "B", "C"]);
    for (const reto of PART1_CHALLENGES) {
      expect(reto.instructionsEs.trim()).not.toBe("");
    }
  });
});
