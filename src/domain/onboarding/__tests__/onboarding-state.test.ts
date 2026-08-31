import { describe, it, expect } from "vitest";
import {
  ONBOARDING_STEPS,
  CRITICAL_STEPS,
  STEP_GUIDANCE,
  SKIP_COMMAND,
  SKIP_VALUE,
  canSkip,
  getNextStep,
} from "../onboarding-state";

describe("onboarding-state — orden de pasos", () => {
  it("mantiene los 6 pasos en el orden fijo esperado", () => {
    expect([...ONBOARDING_STEPS]).toEqual([
      "name",
      "age",
      "role",
      "years_in_role",
      "tech_stack",
      "skills",
    ]);
  });

  it("tiene una guía en lenguaje llano para cada paso", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(typeof STEP_GUIDANCE[step]).toBe("string");
      expect(STEP_GUIDANCE[step].length).toBeGreaterThan(0);
    }
  });

  it("expone el comando y el valor de skip como constantes", () => {
    expect(SKIP_COMMAND).toBe("skip");
    expect(SKIP_VALUE).toBe("skipped");
  });
});

describe("onboarding-state — canSkip", () => {
  it("no permite saltar los pasos críticos (name)", () => {
    expect(CRITICAL_STEPS).toContain("name");
    expect(canSkip("name")).toBe(false);
  });

  it("permite saltar los pasos no críticos", () => {
    expect(canSkip("age")).toBe(true);
    expect(canSkip("role")).toBe(true);
    expect(canSkip("years_in_role")).toBe(true);
    expect(canSkip("tech_stack")).toBe(true);
    expect(canSkip("skills")).toBe(true);
  });
});

describe("onboarding-state — getNextStep", () => {
  it("arranca en el primer paso cuando no hay nada completado (null)", () => {
    expect(getNextStep(null)).toBe("name");
  });

  it("avanza al paso inmediatamente posterior", () => {
    expect(getNextStep("name")).toBe("age");
    expect(getNextStep("age")).toBe("role");
    expect(getNextStep("tech_stack")).toBe("skills");
  });

  it("devuelve null cuando el último paso ya se completó", () => {
    expect(getNextStep("skills")).toBeNull();
  });

  it("reinicia desde el principio ante un paso desconocido (paridad con el .py)", () => {
    // @ts-expect-error — probamos entrada inválida a propósito
    expect(getNextStep("nonexistent")).toBe("name");
  });
});
