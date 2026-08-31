import { describe, it, expect } from "vitest";
import { SEVEN_STEP_CYCLE, stepsForSessionHalf } from "../seven-step-cycle";

describe("SEVEN_STEP_CYCLE", () => {
  it("define los siete pasos en orden con sus minutos (0.3 del libro)", () => {
    expect(SEVEN_STEP_CYCLE.map((s) => s.step)).toEqual([
      "scenario",
      "input",
      "notice",
      "sound",
      "chunks",
      "practice",
      "challenge",
    ]);
    expect(SEVEN_STEP_CYCLE.map((s) => s.minutes)).toEqual([2, 6, 8, 5, 5, 8, 6]);
  });

  it("suma 40 minutos en total, el diseño del ciclo", () => {
    const total = SEVEN_STEP_CYCLE.reduce((acc, s) => acc + s.minutes, 0);
    expect(total).toBe(40);
  });

  it("cada paso trae nombre y propósito pedagógico no vacíos", () => {
    for (const step of SEVEN_STEP_CYCLE) {
      expect(step.name.length).toBeGreaterThan(0);
      expect(step.purpose.length).toBeGreaterThan(0);
    }
  });
});

describe("stepsForSessionHalf", () => {
  it("devuelve los pasos 1-4 (scenario..sound) para la primera mitad (lunes/jueves)", () => {
    const steps = stepsForSessionHalf(1);
    expect(steps.map((s) => s.step)).toEqual(["scenario", "input", "notice", "sound"]);
  });

  it("devuelve los pasos 5-7 (chunks..challenge) para la segunda mitad (martes/viernes)", () => {
    const steps = stepsForSessionHalf(2);
    expect(steps.map((s) => s.step)).toEqual(["chunks", "practice", "challenge"]);
  });
});
