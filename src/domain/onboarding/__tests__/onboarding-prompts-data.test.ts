import { describe, it, expect } from "vitest";
import { TEMPLATES, buildErrorNote } from "../onboarding-prompts-data";

describe("onboarding-prompts-data — buildErrorNote", () => {
  it("no genera nota cuando no hay errores", () => {
    expect(buildErrorNote(0)).toBe("");
    expect(buildErrorNote(-1)).toBe("");
  });

  it("genera una nota alentadora cuando hay al menos un error", () => {
    expect(buildErrorNote(1)).toMatch(/work on together/);
  });
});

describe("onboarding-prompts-data — TEMPLATES", () => {
  it("expone par [primaria, reintento] para cada paso conocido", () => {
    for (const step of ["name", "age", "role", "years_in_role", "tech_stack", "skills", "resume"]) {
      const pair = TEMPLATES[step];
      expect(pair).toHaveLength(2);
      expect(typeof pair[0]).toBe("function");
      expect(typeof pair[1]).toBe("function");
    }
  });

  it("cae al fallback 'there' cuando no hay nombre", () => {
    expect(TEMPLATES.age[0]({})).toMatch(/Great to meet you, there/);
  });

  it("years_in_role usa el rol recogido en la pregunta principal", () => {
    expect(TEMPLATES.years_in_role[0]({ name: "Ada", role: "QA" })).toMatch(
      /working as a QA/,
    );
  });
});

describe("onboarding-prompts-data — skills (skillsQuestion)", () => {
  it("menciona la primera tecnología del stack cuando existe", () => {
    const q = TEMPLATES.skills[0]({ name: "Ada", role: "Dev", tech_stack: "Python, React" });
    expect(q).toMatch(/Beyond Python,/);
    expect(q).toMatch(/as a Dev/);
  });

  it("omite la mención de tecnología cuando no hay stack", () => {
    const q = TEMPLATES.skills[0]({ name: "Ada", role: "Dev" });
    expect(q).not.toMatch(/Beyond/);
    expect(q).toMatch(/What technical skills/);
  });
});
