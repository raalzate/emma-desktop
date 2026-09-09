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
import type { OnboardingStep } from "@/domain/onboarding/onboarding-state";
import { ONBOARDING_TURN_MAX_TOKENS } from "@/domain/shared/token-budgets";
import {
  buildClosingSummary,
  buildPauseSummary,
  buildTurnPrompt,
  capturedCount,
  INSTANT_GREETING,
  isContextComplete,
  mergeContext,
  missingFields,
  normalizeContext,
  parseTurn,
  REQUIRED_FIELDS,
  type OnboardingContext,
} from "@/domain/onboarding/agentic-onboarding";
import { comprehendStep } from "@/application/onboarding/comprehend-use-case";

const FIELD_STEP: Record<string, OnboardingStep> = {
  name: "name",
  role: "role",
  yearsInRole: "years_in_role",
  techStack: "tech_stack",
  skills: "skills",
};

/** Tope de veces que se le pide al usuario un mismo campo antes de resolverlo por código. */
const MAX_ATTEMPTS_PER_FIELD = 2;

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

  const attempts = new Map<keyof OnboardingContext, number>();

  for (let turn = 0; turn < maxTurns && !isContextComplete(ctx); turn++) {
    // El campo objetivo de este turno es el que se preguntó en `lastEmma`: el
    // primer faltante ANTES de llamar al modelo (ctx todavía no cambió).
    const targetField = missingFields(ctx)[0];
    const attemptNumber = (attempts.get(targetField) ?? 0) + 1;
    attempts.set(targetField, attemptNumber);

    const { system, user } = buildTurnPrompt(ctx, lastEmma, lastUser);
    const raw = await llm({ prompt: user, system, maxTokens: ONBOARDING_TURN_MAX_TOKENS });
    const { message, extracted } = parseTurn(raw);

    ctx = await mergeAndPersist(ctx, extracted, repo);
    // Red de extracción: si el modelo no emitió DATA para el campo pedido, el
    // código decide — no se depende de que el LLM recuerde emitir la línea.
    if (missingFields(ctx).includes(targetField)) {
      ctx = await recoverField({ field: targetField, rawUser: lastUser, attemptNumber, ctx, llm, repo });
    }
    onProgress?.(capturedCount(ctx), REQUIRED_FIELDS.length);

    if (isContextComplete(ctx)) break;
    lastEmma = message;
    lastUser = (await io.ask(message)).trim();
  }

  const completed = isContextComplete(ctx);
  await io.notify?.(completed ? buildClosingSummary(ctx) : buildPauseSummary(ctx));
  if (completed) await repo.markCompleted();
  return { context: ctx, completed };
}

/** Texto con contenido sustantivo: descarta respuestas vacías o de un carácter. */
function hasSubstance(text: string): boolean {
  return text.trim().length >= 2;
}

/**
 * Intenta recuperar un campo que el turno no capturó vía `DATA:`, apoyándose en
 * `comprehendStep` (extracción focalizada ya existente, que a su vez cae al
 * texto crudo si no logra extraer nada). Solo el código decide cuándo intentar:
 * en el primer intento exige contenido sustantivo; al segundo intento, agotado
 * el tope, se prueba igual para no volver a preguntar un tercer turno.
 */
async function recoverField(args: {
  field: keyof OnboardingContext;
  rawUser: string;
  attemptNumber: number;
  ctx: OnboardingContext;
  llm: LlmGenerate;
  repo: OnboardingRepository;
}): Promise<OnboardingContext> {
  const { field, rawUser, attemptNumber, ctx, llm, repo } = args;
  const trimmedUser = rawUser.trim();
  if (!trimmedUser) return ctx;
  if (!hasSubstance(trimmedUser) && attemptNumber < MAX_ATTEMPTS_PER_FIELD) return ctx;

  const step = FIELD_STEP[field];
  if (!step) return ctx;
  const value = await extractViaComprehend(llm, step, trimmedUser);
  if (!value) return ctx;

  return mergeAndPersist(ctx, { [field]: value } as OnboardingContext, repo);
}

async function extractViaComprehend(llm: LlmGenerate, step: OnboardingStep, rawAnswer: string): Promise<string> {
  try {
    const outcome = await comprehendStep({ llm, step, rawAnswer });
    if (outcome.skipped || outcome.value === "") return "";
    return String(outcome.value);
  } catch {
    return ""; // fallo de la red de extracción: el llamador decide el fallback
  }
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
