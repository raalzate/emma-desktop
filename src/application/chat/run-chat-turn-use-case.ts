/**
 * Caso de uso: un turno de chat de simulación (portado de
 * src/application/chat/chat_use_case.py + chat_graph.py + interface/chat_runner.py).
 *
 * Se elimina LangGraph: era un único nodo `generate_response` que hacía streaming.
 * Aquí llamamos directamente al puerto LlmGenerate. El puerto sólo acepta un
 * `prompt` único (no un array de mensajes), así que el historial se pliega dentro
 * del prompt como transcripción — aproximación necesaria a los `message_history`
 * del servicio Python (system + historial + usuario).
 *
 * Se preserva la degradación con tope de 60s: si el LLM se pasa del presupuesto,
 * devolvemos los tokens parciales ya emitidos o, si no hay ninguno, un mensaje
 * amable (idéntico al original).
 */

import { LLM_TIMEOUT_SECONDS } from "@/config/session-config";
import type { LlmGenerate } from "@/domain/ai/llm-port";
import { capHistory, type ChatTurn } from "@/domain/chat/simulation-session";
import { layerHistory } from "@/domain/chat/history-layers";
import { buildSceneMemory, renderSceneMemory } from "@/domain/chat/scene-memory";
import { sanitizeReply, hasNonLatinScript } from "@/domain/chat/sanitize-reply";
import {
  hasIdentityLeak,
  removeIdentityLeak,
  pickRecovery,
} from "@/domain/chat/identity-guard";
import { isGreeting, stripRepeatedGreeting } from "@/domain/chat/greeting-guard";
import { stripRepeatedOpener } from "@/domain/chat/repetition-guard";
import { polishChatReply } from "@/domain/chat/chat-brevity";
import { CHAT_MAX_TOKENS } from "@/domain/shared/token-budgets";

/** Mensaje de degradación cuando el modelo se cuelga (verbatim del original). */
const FALLBACK = "EMMA is having trouble responding right now. Please try again.";

/** Tope de brevedad: EMMA responde en simulación con máximo 3 oraciones. */
const CHAT_REPLY_MAX_SENTENCES = 3;

const TIMEOUT = Symbol("timeout");

/** Espera `p` con un presupuesto de reloj; resuelve al centinela TIMEOUT si se pasa. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | typeof TIMEOUT> {
  const budget = new Promise<typeof TIMEOUT>((resolve) => {
    setTimeout(() => resolve(TIMEOUT), ms);
  });
  return Promise.race([p, budget]);
}

/**
 * Reconstruye el contexto COMPLETO del turno en un solo prompt (BUG-001, fondo):
 * la memoria incremental del motor local (KV-cache) perdía los turnos previos y
 * la persona resaludaba/ignoraba lo dicho. La fuente de verdad es el historial
 * de la app; cada turno viaja con transcripción etiquetada, el mensaje nuevo y
 * la instrucción de continuidad (con el ancla de personaje en el punto de
 * generación, donde el modelo pequeño más la respeta).
 */
function buildPrompt(
  history: ChatTurn[],
  userMessage: string,
  characterAnchor?: string,
  sceneCue?: string,
): string {
  if (history.length === 0) return userMessage;
  // Memoria de escena ANTES de la transcripción: los detalles concretos se
  // fijan aunque los turnos que los introdujeron ya se hayan recortado.
  const memory = renderSceneMemory(buildSceneMemory(history));
  // Capas de contexto: recientes verbatim, smalltalk viejo colapsado a una nota.
  const layered = layerHistory(history);
  const transcript = layered.turns
    .map((t) => `${t.role === "user" ? "Learner" : "You"}: ${t.content}`)
    .join("\n");
  const note = layered.note ? `${layered.note}\n` : "";
  const anchor = characterAnchor ? `${characterAnchor} ` : "";
  const script = sceneCue ? `SCENE SCRIPT — ${sceneCue}\n` : "";
  return (
    (memory ? `${memory}\n\n` : "") +
    `CONVERSATION SO FAR (your lines are "You:"):\n${note}${transcript}\n\n` +
    `NEW MESSAGE from the learner:\n${userMessage}\n\n` +
    script +
    `${anchor}React to the new message and continue the scene naturally — ` +
    "never repeat a greeting or an opener you already used, and never re-ask " +
    "something already answered above. " +
    "Reply with ONE short line of spoken dialogue — nothing else."
  );
}

export interface RunChatTurnArgs {
  llm: LlmGenerate;
  system: string;
  history: ChatTurn[];
  userMessage: string;
  /** Continuidad conversacional: permite al proveedor local mantener memoria real. */
  sessionId?: string;
  /**
   * Ancla de personaje (BUG-001): se antepone a cada turno de sesión local para
   * que el modelo pequeño no diluya la persona cuando el system quedó lejos en
   * el KV-cache. La nube no la necesita: recibe el system completo por turno.
   */
  characterAnchor?: string;
  /** Directiva de escena para ESTE turno (ver domain/chat/scene-state). */
  sceneCue?: string;
  /** Verify del loop: false ⇒ la respuesta se rechaza y se reintenta. */
  validateReply?: (reply: string) => boolean;
  onToken?: (chunk: string) => void;
}

/**
 * Limpia artefactos, fugas, resaludos y openers repetidos. Devuelve "" cuando
 * nada válido sobrevivió O cuando la respuesta repite el último turno de la
 * persona: el caller decide reintentar o recuperar en personaje.
 */
function cleanReply(
  raw: string,
  maxSentences: number,
  alreadyGreeted: boolean,
  previousAssistantTurns: readonly string[],
  learnerGreeted: boolean,
): string {
  const sane = sanitizeReply(raw);
  const noLeak = removeIdentityLeak(sane);
  const inCharacter = stripRepeatedOpener(
    stripRepeatedGreeting(noLeak, alreadyGreeted, { learnerGreeted }),
    previousAssistantTurns,
  );
  const polished = polishChatReply(inCharacter, maxSentences);
  const last = previousAssistantTurns[previousAssistantTurns.length - 1]?.trim();
  return polished === last ? "" : polished;
}

/** Nudge correctivo del reintento: la primera generación fue inválida. */
const RETRY_NUDGE =
  "\n\nYour previous reply was rejected (meta text, repetition, or wrong language). " +
  "Reply again: ONE short, natural spoken line as your character, with different wording.";

/**
 * Compuerta de streaming (BUG-001): la UI mostraba los tokens crudos ANTES del
 * saneado — fugas de identidad y escrituras no latinas se veían en vivo aunque
 * la respuesta final saliera limpia. Se retiene la apertura hasta la primera
 * frontera de oración (o un tope de caracteres); si es segura fluye, si no se
 * suprime el stream y la burbuja recibe solo la respuesta final ya limpia.
 */
const STREAM_HOLDBACK_CHARS = 80;

function isStreamSafe(text: string): boolean {
  return !hasIdentityLeak(text) && !hasNonLatinScript(text);
}

/** Ejecuta un turno: arma el prompt, hace streaming y devuelve la respuesta completa. */
export async function runChatTurn(args: RunChatTurnArgs): Promise<string> {
  const prompt = buildPrompt(
    capHistory(args.history),
    args.userMessage,
    args.characterAnchor,
    args.sceneCue,
  );
  // La persona ya abrió la escena si hay algún turno suyo en el historial.
  const alreadyGreeted = args.history.some((t) => t.role === "assistant");
  const previousAssistant = args.history
    .filter((t) => t.role === "assistant")
    .map((t) => t.content);
  const tokens: string[] = [];
  let held = "";
  let flushing = false;
  let suppressed = false;
  const onToken = (chunk: string): void => {
    tokens.push(chunk);
    if (!args.onToken || suppressed) return;
    if (flushing) {
      args.onToken(chunk);
      return;
    }
    held += chunk;
    const atBoundary = /[.!?…]\s/.test(held) || held.length >= STREAM_HOLDBACK_CHARS;
    if (!atBoundary) return;
    if (isStreamSafe(held)) {
      flushing = true;
      args.onToken(held);
    } else {
      suppressed = true;
    }
  };
  // Limpieza + Verify del loop: una respuesta que el validador rechaza
  // (p.ej. re-pregunta un ítem del checklist ya cubierto) cuenta como inválida.
  // El aprendiz saludó en este turno: la persona puede devolver el saludo. Sin
  // esto, responder "hi, good morning" con una pregunta seca era lo normal.
  const learnerGreeted = isGreeting(args.userMessage);
  const clean = (raw: string): string => {
    const cleaned = cleanReply(
      raw,
      CHAT_REPLY_MAX_SENTENCES,
      alreadyGreeted,
      previousAssistant,
      learnerGreeted,
    );
    if (cleaned && args.validateReply && !args.validateReply(cleaned)) return "";
    return cleaned;
  };
  const generation = args.llm({
    prompt,
    system: args.system,
    maxTokens: CHAT_MAX_TOKENS,
    sessionId: args.sessionId,
    onToken,
  });
  const result = await withTimeout(generation, LLM_TIMEOUT_SECONDS * 1000);
  // Timeout: devuelve lo parcial ya emitido, o el fallback si no hubo tokens.
  if (result === TIMEOUT) {
    if (tokens.length === 0) return FALLBACK;
    return clean(tokens.join("")) || FALLBACK;
  }
  const firstTry = clean(result);
  if (firstTry) return firstTry;
  if (!result.trim()) return FALLBACK;
  // Loop de validación (BUG-001): la generación fue basura (meta/fuga/repetición)
  // → UN reintento con nudge correctivo, sin streaming (la burbuja espera el final).
  const retry = await withTimeout(
    args.llm({
      prompt: prompt + RETRY_NUDGE,
      system: args.system,
      maxTokens: CHAT_MAX_TOKENS,
      sessionId: args.sessionId,
    }),
    LLM_TIMEOUT_SECONDS * 1000,
  );
  const secondTry = retry === TIMEOUT ? "" : clean(retry);
  if (secondTry) return secondTry;
  // Dos generaciones inválidas → recuperación EN PERSONAJE, nunca la misma
  // línea dos turnos seguidos (el fallback técnico rompería la inmersión).
  return pickRecovery(previousAssistant[previousAssistant.length - 1] ?? "");
}
