import { describe, expect, it } from "vitest";
import { SETUP_CHECK_VERSION, type SetupCheckRecord } from "@/domain/setup/setup-check-record";
import { needsFirstRunCheck } from "../first-run-gate-use-case";
import { repoFalso } from "./fakes";

const registro = (verdict: "pass" | "warn" | "blocked", acknowledged = false): SetupCheckRecord => ({
  version: SETUP_CHECK_VERSION, at: 1, trigger: "first-run", acknowledged, diagnosis: { verdict, probes: [] },
});

describe("needsFirstRunCheck", () => {
  it("sin registro y sin onboarding exige el chequeo", async () => {
    expect(await needsFirstRunCheck({ repo: repoFalso(), onboardingCompleted: false })).toBe(true);
  });
  it("con marca verde vigente no vuelve a bloquear", async () => {
    expect(await needsFirstRunCheck({ repo: repoFalso([registro("pass")]), onboardingCompleted: false })).toBe(false);
  });
  it("con advertencia sin reconocer lo exige; reconocida no", async () => {
    expect(await needsFirstRunCheck({ repo: repoFalso([registro("warn")]), onboardingCompleted: false })).toBe(true);
    expect(await needsFirstRunCheck({ repo: repoFalso([registro("warn", true)]), onboardingCompleted: false })).toBe(false);
  });
  it("con onboarding completo no exige nada", async () => {
    expect(await needsFirstRunCheck({ repo: repoFalso(), onboardingCompleted: true })).toBe(false);
  });
  it("un repositorio que falla no bloquea la app", async () => {
    const repo = { ...repoFalso(), last: async () => { throw new Error("json roto"); } };
    expect(await needsFirstRunCheck({ repo, onboardingCompleted: false })).toBe(false);
  });
});
