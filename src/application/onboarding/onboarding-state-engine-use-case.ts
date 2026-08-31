/**
 * Motor de estados del onboarding — orquesta el progreso por pasos y escribe en
 * el repositorio de perfil inyectado (portado de
 * onboarding_state_engine_use_case.py, sin LangGraph).
 *
 * El nivel de inglés NO se pregunta: el perfil arranca en A1 (emptyProfile) y
 * sube por escenarios, así que aquí no se asigna ningún nivel.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { UserProfile } from "@/domain/profile/user-profile";
import type { OnboardingIo, OnboardingRepository } from "@/domain/onboarding/i-onboarding-repository";
import { buildSummary, getQuestion } from "@/domain/onboarding/onboarding-prompts";
import type { QuestionContext } from "@/domain/onboarding/onboarding-prompts-data";
import {
  getNextStep,
  ONBOARDING_STEPS,
  type OnboardingStep,
} from "@/domain/onboarding/onboarding-state";
import { comprehendStep } from "@/application/onboarding/comprehend-use-case";
import {
  OnboardingStepCollector,
  type ComprehendFn,
} from "@/application/onboarding/onboarding-step-collector";

export interface OnboardingEngineDeps {
  repo: OnboardingRepository;
  /** Opcional: si falta, se usa el texto crudo (sin normalización por LLM). */
  llm?: LlmGenerate;
  onSkip?: (step: OnboardingStep) => void;
}

export interface OnboardingResult {
  profile: UserProfile;
  completed: boolean;
  collected: QuestionContext;
}

export class OnboardingStateEngine {
  private readonly collector: OnboardingStepCollector;

  constructor(private readonly deps: OnboardingEngineDeps) {
    this.collector = new OnboardingStepCollector({
      comprehend: this.buildComprehend(),
      save: (step, value) => this.deps.repo.saveStep(step, value),
      onSkip: this.deps.onSkip,
    });
  }

  /** Ejecuta el onboarding: retomar, saltar o correr completo. */
  async run(io: OnboardingIo): Promise<OnboardingResult> {
    const profile = (await this.deps.repo.getStatus()) ?? (await this.deps.repo.createEmpty());
    if (profile.onboardingState === "completed") {
      return { profile, completed: true, collected: collectedFrom(profile) };
    }
    const collected = collectedFrom(profile);
    await this.sendResumeGreeting(profile, collected, io);
    await this.collectSteps(profile, collected, io);
    await this.confirmAndSummarize(collected, io);
    await this.deps.repo.markCompleted();
    const final = (await this.deps.repo.getStatus()) ?? profile;
    return { profile: final, completed: true, collected };
  }

  private buildComprehend(): ComprehendFn {
    const llm = this.deps.llm;
    if (!llm) return async () => ({ value: "", skipped: false });
    return (step, raw) => comprehendStep({ llm, step, rawAnswer: raw });
  }

  private async collectSteps(
    profile: UserProfile,
    collected: QuestionContext,
    io: OnboardingIo,
  ): Promise<void> {
    for (const step of remainingSteps(profile, collected)) {
      const value = await this.collector.collect(step, { ...collected }, io);
      if (value === null) break; // se rindió en este paso → detener la cadena
      collected[step] = value;
    }
  }

  private async sendResumeGreeting(
    profile: UserProfile,
    collected: QuestionContext,
    io: OnboardingIo,
  ): Promise<void> {
    const resuming = profile.onboardingState === "in_progress" && Boolean(collected.name);
    if (resuming && io.notify) await io.notify(getQuestion("resume", collected, 0));
  }

  private async confirmAndSummarize(collected: QuestionContext, io: OnboardingIo): Promise<void> {
    await io.ask(buildSummary(collected));
  }
}

/** Campos ya recogidos, con claves = nombres de paso (snake_case). */
function collectedFrom(p: UserProfile): QuestionContext {
  const out: QuestionContext = {};
  if (p.name) out.name = p.name;
  if (p.age != null) out.age = p.age;
  if (p.role) out.role = p.role;
  if (p.yearsInRole != null) out.years_in_role = p.yearsInRole;
  if (p.techStack) out.tech_stack = p.techStack;
  if (p.skills) out.skills = p.skills;
  return out;
}

/** Pasos aún pendientes, en orden, desde el siguiente al último completado. */
function remainingSteps(p: UserProfile, collected: QuestionContext): OnboardingStep[] {
  const next = getNextStep(p.onboardingStepLastCompleted as OnboardingStep | null);
  if (next === null) return [];
  const start = ONBOARDING_STEPS.indexOf(next);
  return ONBOARDING_STEPS.slice(start).filter((step) => !(step in collected));
}
