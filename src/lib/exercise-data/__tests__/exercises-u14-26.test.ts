/**
 * Pruebas de integridad de la transcripción de ejercicios U14–26 (Practice +
 * Apéndice I) y de los recursos del Apéndice K.
 */

import { describe, expect, it } from "vitest";
import { EXERCISES_U14_26 } from "../exercises-u14-26";
import { LEARNING_RESOURCES } from "@/lib/reference-data/resources";
import type { UnitExercise } from "@/domain/exercises/exercise";

const UNITS = Array.from({ length: 13 }, (_, i) => 14 + i); // 14..26

/** Ordenaciones y producción libre/modelo pueden tener un solo ítem. */
function minItemsPermitidos(exercise: UnitExercise): number {
  if (exercise.kind === "order") return 1;
  const todosModelo = exercise.items.every((item) => item.noteEs !== undefined);
  return todosModelo ? 1 : 3;
}

describe("EXERCISES_U14_26 — ejercicios cerrados de las unidades 14–26", () => {
  it("tiene ids únicos", () => {
    const ids = EXERCISES_U14_26.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada id pertenece a su unidad declarada (formato <unit><letra>)", () => {
    for (const exercise of EXERCISES_U14_26) {
      expect(exercise.id).toMatch(new RegExp(`^${exercise.unit}[A-H]$`));
    }
  });

  it("cada ejercicio tiene ≥3 ítems (se permite ≥1 en ordenaciones y producción modelo)", () => {
    for (const exercise of EXERCISES_U14_26) {
      expect(
        exercise.items.length,
        `ejercicio ${exercise.id} tiene ${exercise.items.length} ítems`,
      ).toBeGreaterThanOrEqual(minItemsPermitidos(exercise));
    }
  });

  it("todos los ítems tienen stem y answer no vacíos", () => {
    for (const exercise of EXERCISES_U14_26) {
      for (const item of exercise.items) {
        expect(item.stem.trim(), `stem vacío en ${exercise.id}`).not.toBe("");
        expect(item.answer.trim(), `answer vacío en ${exercise.id}`).not.toBe("");
      }
    }
  });

  it("las unidades 14 a 26 están presentes con ≥3 ejercicios cada una", () => {
    for (const unit of UNITS) {
      const deUnidad = EXERCISES_U14_26.filter((e) => e.unit === unit);
      expect(
        deUnidad.length,
        `la unidad ${unit} tiene ${deUnidad.length} ejercicios`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("no hay unidades fuera del rango 14–26", () => {
    for (const exercise of EXERCISES_U14_26) {
      expect(exercise.unit).toBeGreaterThanOrEqual(14);
      expect(exercise.unit).toBeLessThanOrEqual(26);
    }
  });

  it("los prompts están en español (no vacíos)", () => {
    for (const exercise of EXERCISES_U14_26) {
      expect(exercise.promptEs.trim()).not.toBe("");
    }
  });

  it("las ordenaciones 23C y 23E tienen la secuencia con flechas", () => {
    const c = EXERCISES_U14_26.find((e) => e.id === "23C");
    const e = EXERCISES_U14_26.find((e) => e.id === "23E");
    expect(c?.items[0]?.answer).toBe("b→d→e→a→c→f");
    expect(e?.items[0]?.answer).toBe("e→b→c→a→d");
  });
});

describe("LEARNING_RESOURCES — Apéndice K", () => {
  it("cubre al menos 8 categorías", () => {
    const categorias = new Set(LEARNING_RESOURCES.map((r) => r.category));
    expect(categorias.size).toBeGreaterThanOrEqual(8);
  });

  it("incluye la advertencia final como categoría 'advertencia'", () => {
    expect(
      LEARNING_RESOURCES.some((r) => r.category === "advertencia"),
    ).toBe(true);
  });

  it("todos los recursos tienen nombre y nota no vacíos", () => {
    for (const resource of LEARNING_RESOURCES) {
      expect(resource.name.trim()).not.toBe("");
      expect(resource.noteEs.trim()).not.toBe("");
    }
  });
});
