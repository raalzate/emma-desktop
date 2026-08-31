import { describe, it, expect } from "vitest";
import { STEP_SCHEMAS } from "../step-extraction-schema";
import { ONBOARDING_STEPS } from "../onboarding-state";

describe("step-extraction-schema", () => {
  it("define un esquema para cada paso del onboarding", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(STEP_SCHEMAS[step]).toBeDefined();
      expect(STEP_SCHEMAS[step].step).toBe(step);
    }
  });

  it("tipa age y years_in_role como enteros", () => {
    expect(STEP_SCHEMAS.age.expectedType).toBe("int");
    expect(STEP_SCHEMAS.years_in_role.expectedType).toBe("int");
  });

  it("conserva el esquema cefr para english_level aunque ya no sea un paso", () => {
    expect(STEP_SCHEMAS.english_level.expectedType).toBe("cefr");
    expect(ONBOARDING_STEPS).not.toContain("english_level");
  });
});
