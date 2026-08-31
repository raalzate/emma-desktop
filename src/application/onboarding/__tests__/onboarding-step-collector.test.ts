import { describe, it, expect } from "vitest";
import type { OnboardingIo } from "@/domain/onboarding/i-onboarding-repository";
import { SKIP_VALUE, type OnboardingStep } from "@/domain/onboarding/onboarding-state";
import type { ComprehendOutcome } from "../comprehend-use-case";
import { OnboardingStepCollector, type ComprehendFn } from "../onboarding-step-collector";

interface Harness {
  saved: Array<{ step: OnboardingStep; value: string | number }>;
  skipped: OnboardingStep[];
  asked: string[];
  notified: string[];
  io: OnboardingIo;
}

function harness(answers: string[]): Harness {
  const saved: Harness["saved"] = [];
  const skipped: OnboardingStep[] = [];
  const asked: string[] = [];
  const notified: string[] = [];
  let i = 0;
  const io: OnboardingIo = {
    ask: async (prompt) => {
      asked.push(prompt);
      return answers[i++] ?? "";
    },
    notify: (m) => {
      notified.push(m);
    },
  };
  return { saved, skipped, asked, notified, io };
}

const collectorWith = (
  h: Harness,
  comprehend: ComprehendFn,
): OnboardingStepCollector =>
  new OnboardingStepCollector({
    comprehend,
    save: async (step, value) => {
      h.saved.push({ step, value });
    },
    onSkip: (step) => {
      h.skipped.push(step);
    },
  });

const outcome = (value: string | number, skipped = false): ComprehendOutcome => ({ value, skipped });

describe("onboarding-step-collector — camino feliz", () => {
  it("guarda y devuelve el valor validado en el primer intento", async () => {
    const h = harness(["Ada"]);
    const collector = collectorWith(h, async () => outcome("Ada"));
    const value = await collector.collect("name", {}, h.io);
    expect(value).toBe("Ada");
    expect(h.saved).toEqual([{ step: "name", value: "Ada" }]);
    expect(h.asked).toHaveLength(1);
  });

  it("coacciona a entero un valor numérico devuelto como texto", async () => {
    const h = harness(["I am 29"]);
    const collector = collectorWith(h, async () => outcome("29"));
    const value = await collector.collect("age", {}, h.io);
    expect(value).toBe(29);
    expect(h.saved).toEqual([{ step: "age", value: 29 }]);
  });
});

describe("onboarding-step-collector — skip", () => {
  it("marca el paso, invoca onSkip y guarda el valor de omisión", async () => {
    const h = harness(["skip"]);
    const collector = collectorWith(h, async () => outcome(SKIP_VALUE, true));
    const value = await collector.collect("role", {}, h.io);
    expect(value).toBe(SKIP_VALUE);
    expect(h.skipped).toEqual(["role"]);
    expect(h.saved).toEqual([{ step: "role", value: SKIP_VALUE }]);
  });
});

describe("onboarding-step-collector — reintento y rendición", () => {
  it("envía guía y reintenta cuando el primer intento no valida", async () => {
    const h = harness(["???", "QA Engineer"]);
    let call = 0;
    const collector = collectorWith(h, async () => (call++ === 0 ? outcome("") : outcome("QA Engineer")));
    const value = await collector.collect("role", {}, h.io);
    expect(value).toBe("QA Engineer");
    expect(h.notified).toHaveLength(1); // guía enviada tras el fallo del intento 0
    expect(h.asked).toHaveLength(2); // se preguntó dos veces
    expect(h.saved).toEqual([{ step: "role", value: "QA Engineer" }]);
  });

  it("se rinde (null) tras dos intentos fallidos y no guarda nada", async () => {
    const h = harness(["", ""]);
    const collector = collectorWith(h, async () => outcome(""));
    const value = await collector.collect("role", {}, h.io);
    expect(value).toBeNull();
    expect(h.saved).toEqual([]);
    expect(h.asked).toHaveLength(2);
  });

  it("se rinde ante un valor numérico inválido en ambos intentos", async () => {
    const h = harness(["old", "still old"]);
    const collector = collectorWith(h, async () => outcome("0"));
    const value = await collector.collect("age", {}, h.io);
    expect(value).toBeNull();
    expect(h.saved).toEqual([]);
  });
});
