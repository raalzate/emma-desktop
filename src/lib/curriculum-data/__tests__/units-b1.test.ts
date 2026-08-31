/**
 * Pruebas de integridad de la transcripción de las unidades 13–18 (B1)
 * del libro «English for Software Engineers».
 */

import { describe, expect, it } from "vitest";

import type { ChallengeMode } from "@/domain/curriculum/unit";
import { UNITS_B1 } from "@/lib/curriculum-data/units-b1";

const MODOS_VALIDOS: ChallengeMode[] = ["written", "oral", "real-work", "memorization"];

describe("UNITS_B1 — unidades 13–18 del libro fuente", () => {
  it("contiene exactamente 6 unidades", () => {
    expect(UNITS_B1).toHaveLength(6);
  });

  it("las unidades están numeradas 13–18 en orden", () => {
    expect(UNITS_B1.map((u) => u.number)).toEqual([13, 14, 15, 16, 17, 18]);
  });

  it("todas las unidades son de nivel B1", () => {
    for (const unidad of UNITS_B1) {
      expect(unidad.cefrLevel).toBe("B1");
    }
  });

  it("cada unidad tiene al menos 10 chunks con texto y función no vacíos", () => {
    for (const unidad of UNITS_B1) {
      expect(unidad.chunks.length).toBeGreaterThanOrEqual(10);
      for (const chunk of unidad.chunks) {
        expect(chunk.text.trim()).not.toBe("");
        expect(chunk.functionEs.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad tiene al menos 3 trampas con wrong/right no vacíos", () => {
    for (const unidad of UNITS_B1) {
      expect(unidad.traps.length).toBeGreaterThanOrEqual(3);
      for (const trampa of unidad.traps) {
        expect(trampa.wrong.trim()).not.toBe("");
        expect(trampa.right.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad tiene al menos 2 retos con instrucciones, criterios y modo válidos", () => {
    for (const unidad of UNITS_B1) {
      expect(unidad.challenges.length).toBeGreaterThanOrEqual(2);
      for (const reto of unidad.challenges) {
        expect(reto.instructionsEs.trim()).not.toBe("");
        expect(reto.criteria.length).toBeGreaterThan(0);
        for (const criterio of reto.criteria) {
          expect(criterio.trim()).not.toBe("");
        }
        expect(MODOS_VALIDOS).toContain(reto.mode);
      }
    }
  });

  it("los retos siguen la numeración global 27–42 del libro", () => {
    const idsEsperados: Record<number, number[]> = {
      13: [27, 28, 29],
      14: [30, 31],
      15: [32, 33, 34],
      16: [35, 36],
      17: [37, 38, 39],
      18: [40, 41, 42],
    };
    for (const unidad of UNITS_B1) {
      expect(unidad.challenges.map((r) => r.id)).toEqual(idsEsperados[unidad.number]);
    }
  });

  it("los campos descriptivos no están vacíos", () => {
    for (const unidad of UNITS_B1) {
      expect(unidad.title.trim()).not.toBe("");
      expect(unidad.scenarioEs.trim()).not.toBe("");
      expect(unidad.goalEs.trim()).not.toBe("");
      expect(unidad.soundFocus.trim()).not.toBe("");
      expect(unidad.grammarFocus.length).toBeGreaterThan(0);
      for (const foco of unidad.grammarFocus) {
        expect(foco.trim()).not.toBe("");
      }
    }
  });

  it("los scenarioTypes coinciden con el mapeo acordado", () => {
    const esperados: Record<number, string[]> = {
      13: ["code_review"],
      14: ["incident_postmortem"],
      15: ["design_review", "architecture_pitch"],
      16: ["meeting_recap", "retrospective"],
      17: ["multi_team_sync", "release_planning", "retrospective"],
      18: ["design_review", "architecture_pitch", "tech_interview"],
    };
    for (const unidad of UNITS_B1) {
      expect(unidad.scenarioTypes).toEqual(esperados[unidad.number]);
    }
  });

  it("la unidad 13 incluye el arsenal de hedges y los chunks de recibir crítica", () => {
    const unidad13 = UNITS_B1.find((u) => u.number === 13);
    expect(unidad13).toBeDefined();
    const textos = unidad13?.chunks.map((c) => c.text) ?? [];
    expect(textos).toContain("I might be missing something, but…");
    expect(textos).toContain("Non-blocking.");
    expect(textos).toContain("Good catch.");
  });

  it("la unidad 17 incluye el repertorio funcional completo (bloques A–G)", () => {
    const unidad17 = UNITS_B1.find((u) => u.number === 17);
    expect(unidad17).toBeDefined();
    // Al menos 40 frases: el objetivo de la unidad es automatizar cuarenta.
    expect(unidad17?.chunks.length ?? 0).toBeGreaterThanOrEqual(40);
    const textos = unidad17?.chunks.map((c) => c.text) ?? [];
    expect(textos).toContain("Can I come back to you on that?"); // A: ganar tiempo
    expect(textos).toContain("Sorry, I didn't catch that."); // B: pedir aclaración
    expect(textos).toContain("Sorry, can I jump in here?"); // C: interrumpir
    expect(textos).toContain("I'd push back on that a bit."); // D: discrepar
    expect(textos).toContain("I'd second that."); // E: acuerdo
    expect(textos).toContain("Let's take this offline."); // F: proponer y decidir
    expect(textos).toContain("I have a hard stop at 3."); // G: cerrar y salir
  });
});
