/**
 * Pruebas de integridad de la transcripción de ejercicios cerrados
 * (Parte 1 + unidades 1–13) frente al contrato UnitExercise.
 */
import { describe, expect, it } from "vitest";

import { EXERCISES_P1_U13 } from "../exercises-part1-u13";

describe("EXERCISES_P1_U13 — ejercicios cerrados Parte 1 y unidades 1–13", () => {
  it("tiene ids únicos", () => {
    const ids = EXERCISES_P1_U13.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo ejercicio tiene al menos 3 ítems", () => {
    for (const exercise of EXERCISES_P1_U13) {
      expect(exercise.items.length, `ejercicio ${exercise.id}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("cubre las unidades 0 a 13", () => {
    const units = new Set(EXERCISES_P1_U13.map((exercise) => exercise.unit));
    for (let unit = 0; unit <= 13; unit += 1) {
      expect(units.has(unit), `falta la unidad ${unit}`).toBe(true);
    }
  });

  it("cada unidad 1–13 tiene al menos 3 ejercicios", () => {
    for (let unit = 1; unit <= 13; unit += 1) {
      const count = EXERCISES_P1_U13.filter((exercise) => exercise.unit === unit).length;
      expect(count, `unidad ${unit}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("todos los stems y answers son no vacíos", () => {
    for (const exercise of EXERCISES_P1_U13) {
      expect(exercise.promptEs.trim(), `promptEs de ${exercise.id}`).not.toBe("");
      for (const item of exercise.items) {
        expect(item.stem.trim(), `stem vacío en ${exercise.id}`).not.toBe("");
        expect(item.answer.trim(), `answer vacía en ${exercise.id}`).not.toBe("");
      }
    }
  });
});
