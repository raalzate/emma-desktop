/**
 * Pruebas de integridad de los datos de referencia (Apéndices A–G).
 * Verifican volúmenes mínimos, cobertura de categorías/patrones/situaciones,
 * campos obligatorios no vacíos y ausencia de duplicados de id/base.
 */
import { describe, expect, it } from "vitest";

import type { VerbPattern } from "@/domain/reference/reference";
import { IRREGULAR_VERBS } from "@/lib/reference-data/irregular-verbs";
import { PHRASAL_VERBS } from "@/lib/reference-data/phrasal-verbs";
import { COLLOCATIONS } from "@/lib/reference-data/collocations";
import { FALSE_FRIENDS } from "@/lib/reference-data/false-friends";
import { COMMON_ERRORS } from "@/lib/reference-data/common-errors";
import { GLOSSARY } from "@/lib/reference-data/glossary";
import {
  PHRASE_BANK,
  SMALL_TALK_FORBIDDEN_TOPICS,
  SMALL_TALK_SAFE_TOPICS,
} from "@/lib/reference-data/phrase-bank";

describe("Apéndice A — verbos irregulares", () => {
  it("contiene al menos 95 verbos", () => {
    expect(IRREGULAR_VERBS.length).toBeGreaterThanOrEqual(95);
  });

  it("cubre los cuatro patrones", () => {
    const esperados: VerbPattern[] = [
      "all-same",
      "past-eq-participle",
      "all-different",
      "double-form",
    ];
    const presentes = new Set(IRREGULAR_VERBS.map((v) => v.pattern));
    for (const patron of esperados) {
      expect(presentes.has(patron)).toBe(true);
    }
  });

  it("no tiene bases duplicadas y sus formas no están vacías", () => {
    const bases = IRREGULAR_VERBS.map((v) => v.base);
    expect(new Set(bases).size).toBe(bases.length);
    for (const verbo of IRREGULAR_VERBS) {
      expect(verbo.base.trim()).not.toBe("");
      expect(verbo.past.trim()).not.toBe("");
      expect(verbo.participle.trim()).not.toBe("");
    }
  });
});

describe("Apéndice B — phrasal verbs", () => {
  it("contiene al menos 110 entradas", () => {
    expect(PHRASAL_VERBS.length).toBeGreaterThanOrEqual(110);
  });

  it("tiene verbo, partícula y significado no vacíos", () => {
    for (const pv of PHRASAL_VERBS) {
      expect(pv.verb.trim()).not.toBe("");
      expect(pv.particle.trim()).not.toBe("");
      expect(pv.meaningEs.trim()).not.toBe("");
    }
  });
});

describe("Apéndice C — colocaciones", () => {
  it("contiene al menos 140 entradas en 7 categorías", () => {
    expect(COLLOCATIONS.length).toBeGreaterThanOrEqual(140);
    const categorias = new Set(COLLOCATIONS.map((c) => c.category));
    expect(categorias.size).toBe(7);
  });

  it("tiene texto y categoría no vacíos", () => {
    for (const colocacion of COLLOCATIONS) {
      expect(colocacion.text.trim()).not.toBe("");
      expect(colocacion.category.trim()).not.toBe("");
    }
  });
});

describe("Apéndice D — falsos amigos", () => {
  it("contiene al menos 55 entradas con campos no vacíos", () => {
    expect(FALSE_FRIENDS.length).toBeGreaterThanOrEqual(55);
    for (const ff of FALSE_FRIENDS) {
      expect(ff.english.trim()).not.toBe("");
      expect(ff.notMeaningEs.trim()).not.toBe("");
      expect(ff.meaningEs.trim()).not.toBe("");
      expect(ff.useInsteadEn.trim()).not.toBe("");
    }
  });
});

describe("Apéndice E — errores frecuentes", () => {
  it("contiene exactamente 50 errores con ids 1–50 sin duplicados", () => {
    expect(COMMON_ERRORS.length).toBe(50);
    const ids = COMMON_ERRORS.map((e) => e.id);
    expect(new Set(ids).size).toBe(50);
    const ordenados = [...ids].sort((a, b) => a - b);
    expect(ordenados[0]).toBe(1);
    expect(ordenados[49]).toBe(50);
  });

  it("tiene forma incorrecta, corrección y categoría no vacías", () => {
    for (const error of COMMON_ERRORS) {
      expect(error.wrong.trim()).not.toBe("");
      expect(error.right.trim()).not.toBe("");
      expect(error.categoryEs.trim()).not.toBe("");
    }
  });

  it("cubre los cinco bloques E.1–E.5", () => {
    const categorias = new Set(COMMON_ERRORS.map((e) => e.categoryEs));
    expect(categorias.size).toBe(5);
  });
});

describe("Apéndice F — glosario", () => {
  it("contiene al menos 60 entradas con campos no vacíos", () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(60);
    for (const entrada of GLOSSARY) {
      expect(entrada.es.trim()).not.toBe("");
      expect(entrada.en.trim()).not.toBe("");
      expect(entrada.ipa.trim()).not.toBe("");
    }
  });
});

describe("Apéndice G — banco de frases", () => {
  it("cubre las siete situaciones", () => {
    const situaciones = new Set(PHRASE_BANK.map((p) => p.situation));
    expect(situaciones).toEqual(
      new Set([
        "standup",
        "code_review",
        "incident",
        "meeting",
        "interview",
        "one_on_one",
        "small_talk",
      ]),
    );
  });

  it("tiene función y frase no vacías", () => {
    for (const entrada of PHRASE_BANK) {
      expect(entrada.functionEs.trim()).not.toBe("");
      expect(entrada.phrase.trim()).not.toBe("");
    }
  });

  it("incluye temas seguros y prohibidos de small talk", () => {
    expect(SMALL_TALK_SAFE_TOPICS.length).toBeGreaterThan(0);
    expect(SMALL_TALK_FORBIDDEN_TOPICS.length).toBeGreaterThan(0);
    for (const tema of [...SMALL_TALK_SAFE_TOPICS, ...SMALL_TALK_FORBIDDEN_TOPICS]) {
      expect(tema.trim()).not.toBe("");
    }
  });
});
