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
import { ONBOARDING_TURN_MAX_TOKENS, STRICT_EXTRACTION_MAX_TOKENS } from "@/domain/shared/token-budgets";
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
import { buildStrictPrompts, parseStrictValue } from "@/domain/onboarding/strict-extraction";
import { getQuestion } from "@/domain/onboarding/onboarding-prompts";
import { LLM_TIMEOUT_SECONDS } from "@/config/session-config";

const FIELD_STEP: Record<string, OnboardingStep> = {
  name: "name",
  role: "role",
  yearsInRole: "years_in_role",
  techStack: "tech_stack",
  skills: "skills",
};

/** Tope de veces que se pregunta un mismo campo antes de abandonarlo. */
const MAX_ATTEMPTS_PER_FIELD = 2;

export interface AgenticOnboardingArgs {
  llm: LlmGenerate;
  io: OnboardingIo;
  repo: OnboardingRepository;
  onProgress?: (captured: number, total: number) => void;
  maxTurns?: number;
  /** Presupuesto de reloj por llamada al LLM (inyectable para pruebas). */
  turnTimeoutMs?: number;
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
  const budgetMs = args.turnTimeoutMs ?? LLM_TIMEOUT_SECONDS * 1000;

  void warmup(llm); // precarga el modelo en paralelo, no bloquea el saludo

  let ctx = await loadInitialContext(repo);
  onProgress?.(capturedCount(ctx), REQUIRED_FIELDS.length);

  let lastEmma = buildGreeting(ctx);
  let lastUser = (await io.ask(lastEmma)).trim();

  const attempts = new Map<keyof OnboardingContext, number>();
  const givenUp = new Set<keyof OnboardingContext>();

  for (let turn = 0; turn < maxTurns && !isContextComplete(ctx); turn++) {
    // El campo objetivo de este turno es el que se preguntó en `lastEmma`: el
    // primer faltante ANTES de llamar al modelo (ctx todavía no cambió).
    const targetField = missingFields(ctx).find((f) => !givenUp.has(f));
    if (!targetField) break; // nada más que preguntar sin repetir lo abandonado
    const attemptNumber = (attempts.get(targetField) ?? 0) + 1;
    attempts.set(targetField, attemptNumber);

    const { system, user } = buildTurnPrompt(ctx, lastEmma, lastUser, [...givenUp]);
    const raw = await generateWithBudget(
      llm,
      { prompt: user, system, maxTokens: ONBOARDING_TURN_MAX_TOKENS },
      budgetMs,
    );
    // Si el modelo se cuelga o falla (visto en Linux sin WebGPU), el turno sigue
    // con la pregunta determinista del campo: la UI nunca queda "pensando".
    const { message, extracted } =
      raw === null
        ? { message: fallbackQuestion(targetField, ctx, attemptNumber), extracted: {} }
        : parseTurn(raw);

    ctx = await mergeAndPersist(ctx, extracted, repo);
    // Red de extracción: si el modelo no emitió DATA para el campo pedido, el
    // código decide — no se depende de que el LLM recuerde emitir la línea.
    if (missingFields(ctx).includes(targetField)) {
      ctx = await recoverField({ field: targetField, rawUser: lastUser, ctx, llm, repo, budgetMs });
    }
    // Agotado el tope, el campo se abandona: Emma pasa al siguiente en vez de
    // insistir o de guardar lo que el aprendiz dijo sobre otra cosa.
    if (missingFields(ctx).includes(targetField) && attemptNumber >= MAX_ATTEMPTS_PER_FIELD) {
      givenUp.add(targetField);
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
 * Intenta recuperar un campo que el turno no capturó vía `DATA:`, con una
 * extracción ESTRICTA que puede negarse (`NONE`). La negativa es el punto: el
 * aprendiz pudo haber contestado otra pregunta, y meter ese texto en el campo
 * pendiente cierra el onboarding con datos inventados (visto en la app: la
 * respuesta al cargo terminaba guardada como "qué querés practicar").
 */
async function recoverField(args: {
  field: keyof OnboardingContext;
  rawUser: string;
  ctx: OnboardingContext;
  llm: LlmGenerate;
  repo: OnboardingRepository;
  budgetMs: number;
}): Promise<OnboardingContext> {
  const { field, rawUser, ctx, llm, repo, budgetMs } = args;
  const trimmedUser = rawUser.trim();
  if (!hasSubstance(trimmedUser)) return ctx;

  const step = FIELD_STEP[field];
  if (!step) return ctx;
  const value = await extractStrict(llm, step, trimmedUser, budgetMs);
  if (!value) return ctx; // el texto no traía el dato: se sigue preguntando

  return mergeAndPersist(ctx, { [field]: value } as OnboardingContext, repo);
}

/** Extracción que puede decir "acá no hay nada"; null en ese caso y ante fallo. */
async function extractStrict(
  llm: LlmGenerate,
  step: OnboardingStep,
  rawAnswer: string,
  budgetMs: number,
): Promise<string | null> {
  const { system, user } = buildStrictPrompts(step, rawAnswer);
  const response = await generateWithBudget(
    llm,
    { prompt: user, system, maxTokens: STRICT_EXTRACTION_MAX_TOKENS },
    budgetMs,
  );
  if (response === null) return null;
  return parseStrictValue(response, rawAnswer);
}

/**
 * Llama al LLM con presupuesto de reloj: null si falla o se pasa del tiempo.
 * Sin esto, una generación que nunca termina deja el onboarding colgado —
 * el chat ya tenía este freno (run-chat-turn-use-case), el onboarding no.
 */
async function generateWithBudget(
  llm: LlmGenerate,
  llmArgs: Parameters<LlmGenerate>[0],
  budgetMs: number,
): Promise<string | null> {
  const budget = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), budgetMs);
  });
  try {
    return await Promise.race([llm(llmArgs), budget]);
  } catch {
    return null;
  }
}

/** Pregunta determinista del campo pendiente, cuando el modelo no dio la suya. */
function fallbackQuestion(
  field: keyof OnboardingContext,
  ctx: OnboardingContext,
  attemptNumber: number,
): string {
  const step = FIELD_STEP[field] ?? "name";
  return getQuestion(step, questionContext(ctx), attemptNumber > 1 ? 1 : 0);
}

/** Contexto en snake_case que esperan las plantillas de preguntas. */
function questionContext(ctx: OnboardingContext): Record<string, string | number | undefined> {
  return {
    name: ctx.name,
    role: ctx.role,
    years_in_role: ctx.yearsInRole,
    tech_stack: ctx.techStack,
    skills: ctx.skills,
  };
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
