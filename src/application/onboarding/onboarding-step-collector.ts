/**
 * Colector de un paso del onboarding con reintento, skip y comprehend por LLM
 * (portado de onboarding_step_collector.py).
 *
 * Dos intentos: el intento 0 ofrece guía y vuelve a preguntar; el 1 es final.
 * `skip` en un paso saltable marca el paso; en `name` (crítico) re-pregunta.
 */

import type { OnboardingIo } from "@/domain/onboarding/i-onboarding-repository";
import { getQuestion } from "@/domain/onboarding/onboarding-prompts";
import type { QuestionContext } from "@/domain/onboarding/onboarding-prompts-data";
import { SKIP_VALUE, type OnboardingStep } from "@/domain/onboarding/onboarding-state";
import type { ComprehendOutcome } from "@/application/onboarding/comprehend-use-case";
import { sendGuidance } from "@/application/onboarding/onboarding-input-guidance";

/** Normaliza el texto crudo del usuario. Inyectada desde el motor. */
export type ComprehendFn = (step: OnboardingStep, raw: string) => Promise<ComprehendOutcome>;

type StepValue = string | number;

export interface StepCollectorDeps {
  comprehend: ComprehendFn;
  save: (step: OnboardingStep, value: StepValue) => Promise<void>;
  onSkip?: (step: OnboardingStep) => void;
}

export class OnboardingStepCollector {
  constructor(private readonly deps: StepCollectorDeps) {}

  /** Pregunta por *step* y devuelve el valor validado, o null si se rinde. */
  async collect(step: OnboardingStep, context: QuestionContext, io: OnboardingIo): Promise<StepValue | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const outcome = await this.attempt(step, context, io, attempt);
      if (outcome !== RETRY) return outcome;
    }
    return null;
  }

  private async attempt(
    step: OnboardingStep,
    context: QuestionContext,
    io: OnboardingIo,
    attempt: number,
  ): Promise<StepValue | null | typeof RETRY> {
    const raw = await this.ask(step, context, io, attempt);
    const result = await this.deps.comprehend(step, raw);
    if (result.skipped) return this.finishSkip(step);
    const value = coerce(step, result.value);
    if (value !== null) {
      await this.deps.save(step, value);
      return value;
    }
    if (attempt === 0) {
      await sendGuidance(step, io);
      return RETRY;
    }
    return null; // dos intentos fallidos → rendirse en este paso
  }

  private async finishSkip(step: OnboardingStep): Promise<StepValue> {
    this.deps.onSkip?.(step);
    await this.deps.save(step, SKIP_VALUE);
    return SKIP_VALUE;
  }

  private async ask(
    step: OnboardingStep,
    context: QuestionContext,
    io: OnboardingIo,
    attempt: number,
  ): Promise<string> {
    const answer = await io.ask(getQuestion(step, context, attempt));
    return (answer ?? "").trim();
  }
}

// Sentinela para hilar "vuelve a preguntar" sin sobrecargar null (= rendirse).
const RETRY = Symbol("retry");

/** Valida/normaliza el valor: entero positivo para age/years, texto no vacío. */
function coerce(step: OnboardingStep, value: StepValue): StepValue | null {
  if (step === "age" || step === "years_in_role") {
    const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    return Number.isInteger(n) && n > 0 ? n : null;
  }
  const text = String(value).trim();
  return text ? text : null;
}
