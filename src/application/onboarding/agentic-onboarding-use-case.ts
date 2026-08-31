/**
 * Onboarding conversacional ReAct: Emma dirige la charla y en UNA sola llamada
 * por turno reacciona, pregunta lo que falta y extrae datos del último
 * intercambio (nunca de toda la conversación). El primer saludo se muestra
 * al instante sin esperar al LLM; un warmup en segundo plano precarga el
 * modelo mientras el usuario escribe su primera respuesta.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { OnboardingIo, OnboardingRepository } from "@/domain/onboarding/i-onboarding-repository";
import type { UserProfile } from "@/domain/profile/user-profile";
import { ONBOARDING_TURN_MAX_TOKENS } from "@/domain/shared/token-budgets";
import {
  buildClosingSummary,
  buildTurnPrompt,
  capturedCount,
  INSTANT_GREETING,
  isContextComplete,
  mergeContext,
  normalizeContext,
  parseTurn,
  REQUIRED_FIELDS,
  type OnboardingContext,
} from "@/domain/onboarding/agentic-onboarding";

const FIELD_STEP: Record<string, string> = {
  name: "name",
  role: "role",
  yearsInRole: "years_in_role",
  techStack: "tech_stack",
  skills: "skills",
};

export interface AgenticOnboardingArgs {
  llm: LlmGenerate;
  io: OnboardingIo;
  repo: OnboardingRepository;
  onProgress?: (captured: number, total: number) => void;
  maxTurns?: number;
}

export interface AgenticOnboardingResult {
  context: OnboardingContext;
  completed: boolean;
}

export async function runAgenticOnboarding(
  args: AgenticOnboardingArgs,
): Promise<AgenticOnboardingResult> {
  const { llm, io, repo, onProgress } = args;
  const maxTurns = args.maxTurns ?? 12;

  void warmup(llm); // precarga el modelo en paralelo, no bloquea el saludo

  let ctx = await loadInitialContext(repo);
  onProgress?.(capturedCount(ctx), REQUIRED_FIELDS.length);

  let lastEmma = buildGreeting(ctx);
  let lastUser = (await io.ask(lastEmma)).trim();

  for (let turn = 0; turn < maxTurns && !isContextComplete(ctx); turn++) {
    const { system, user } = buildTurnPrompt(ctx, lastEmma, lastUser);
    const raw = await llm({ prompt: user, system, maxTokens: ONBOARDING_TURN_MAX_TOKENS });
    const { message, extracted } = parseTurn(raw);

    ctx = await mergeAndPersist(ctx, extracted, repo);
    onProgress?.(capturedCount(ctx), REQUIRED_FIELDS.length);

    if (isContextComplete(ctx)) break;
    lastEmma = message;
    lastUser = (await io.ask(message)).trim();
  }

  await io.notify?.(buildClosingSummary(ctx));
  await repo.markCompleted();
  return { context: ctx, completed: true };
}

/** Llamada mínima de precarga; su resultado no importa, solo calienta el modelo. */
async function warmup(llm: LlmGenerate): Promise<void> {
  try {
    await llm({ prompt: "Hi", maxTokens: 8 });
  } catch {
    // silencioso: es solo un warmup, un fallo aquí no debe afectar el onboarding
  }
}

/** Recupera el contexto ya conocido (retomar) o crea un perfil vacío. */
async function loadInitialContext(repo: OnboardingRepository): Promise<OnboardingContext> {
  const existing = await repo.getStatus().catch(() => null);
  if (existing) return profileToContext(existing);
  await repo.createEmpty().catch(() => undefined);
  return {};
}

function profileToContext(p: UserProfile): OnboardingContext {
  const ctx: OnboardingContext = {};
  if (p.name) ctx.name = p.name;
  if (p.role) ctx.role = p.role;
  if (p.yearsInRole != null) ctx.yearsInRole = p.yearsInRole;
  if (p.techStack) ctx.techStack = p.techStack;
  if (p.skills) ctx.skills = p.skills;
  return ctx;
}

function buildGreeting(ctx: OnboardingContext): string {
  if (ctx.name) return `Welcome back, ${ctx.name}! Let's pick up right where we left off.`;
  return INSTANT_GREETING;
}

/** Fusiona lo extraído, normaliza y persiste SOLO los campos nuevos/mejorados. */
async function mergeAndPersist(
  prev: OnboardingContext,
  extracted: OnboardingContext,
  repo: OnboardingRepository,
): Promise<OnboardingContext> {
  const next = normalizeContext(mergeContext(prev, extracted));
  await persistChanged(prev, next, repo);
  return next;
}

async function persistChanged(
  prev: OnboardingContext,
  next: OnboardingContext,
  repo: OnboardingRepository,
): Promise<void> {
  for (const [field, step] of Object.entries(FIELD_STEP)) {
    const value = next[field as keyof OnboardingContext];
    const changed = value !== undefined && value !== prev[field as keyof OnboardingContext];
    if (changed) await repo.saveStep(step, value as string | number);
  }
}
