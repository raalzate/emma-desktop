/**
 * Verificador determinista de una respuesta de la persona para un aprendiz A1.
 *
 * Traduce a métricas medibles lo que `LEVEL_STYLE.A1` le pide al modelo (frases
 * muy cortas, sin modismos ni phrasal verbs, nunca en español) más las reglas
 * base de la escena (no corregir, no revelarse IA). Lo usan los evals de
 * promptfoo (`evals/a1/`) como aserción barata antes del juez LLM; vive en el
 * dominio para que la regla tenga prueba y no se duplique en el eval.
 */

import { hasIdentityLeak } from "@/domain/chat/identity-guard";
import { hasNonLatinScript } from "@/domain/chat/sanitize-reply";

export type A1Violation =
  | "empty"
  | "too-many-sentences"
  | "sentence-too-long"
  | "not-english"
  | "idiom-or-phrasal"
  | "identity-leak"
  | "corrects-learner";

export interface A1ReplyMetrics {
  sentences: number;
  maxWordsPerSentence: number;
  idioms: string[];
}

export interface A1ReplyCheck {
  ok: boolean;
  violations: A1Violation[];
  metrics: A1ReplyMetrics;
}

/** EMMA_BASE pide 1–2 oraciones; se tolera una de cortesía. */
const MAX_SENTENCES = 3;
const MAX_WORDS_PER_SENTENCE = 15;

// Tildes y signos de apertura delatan español; la "é" queda fuera por "café".
const SPANISH_CHARS = /[¿¡ñáíóú]/i;
// Palabras frecuentes del español que no existen en inglés (sin "no", "a", "me").
const SPANISH_WORDS = new Set([
  "hola", "gracias", "entiendo", "puedes", "que", "como", "estas", "esta",
  "pero", "porque", "bueno", "tambien", "trabajo", "hoy", "ayer", "favor",
  "usted", "tienes", "hacer", "haces", "repetir", "ayuda", "dime", "eres",
  "muy", "bien", "donde", "cuando", "nosotros",
]);

/** Modismos y phrasal verbs de oficina que `LEVEL_STYLE.A1` prohíbe. */
const IDIOMS = [
  "circle back", "touch base", "figure out", "catch up", "sync up", "loop in",
  "wrap up", "come up with", "look into", "run into", "put off", "follow up",
  "on the same page", "piece of cake", "hit the ground running", "ballpark",
  "get the ball rolling", "keep me posted", "under the weather", "heads up",
  "bring up", "go over", "set up",
];

const CORRECTION_PATTERNS = [
  /\byou should say\b/i,
  /\bthe correct (?:way|form|word|sentence)\b/i,
  /\bit'?s better to say\b/i,
  /\binstead of ["“']/i,
];

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function wordsOf(text: string): string[] {
  return text.match(/[\p{L}\p{N}'’-]+/gu) ?? [];
}

function looksSpanish(text: string): boolean {
  if (SPANISH_CHARS.test(text)) return true;
  return wordsOf(text).some((w) => SPANISH_WORDS.has(w.toLowerCase()));
}

function idiomsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return IDIOMS.filter((idiom) => new RegExp(`\\b${idiom}\\b`).test(lower));
}

/** Evalúa una respuesta contra el estilo A1. */
export function checkA1Reply(reply: string): A1ReplyCheck {
  const text = reply.trim();
  const sentences = splitSentences(text);
  const maxWordsPerSentence = Math.max(0, ...sentences.map((s) => wordsOf(s).length));
  const idioms = idiomsIn(text);
  const metrics: A1ReplyMetrics = { sentences: sentences.length, maxWordsPerSentence, idioms };
  if (!text) return { ok: false, violations: ["empty"], metrics };

  const violations: A1Violation[] = [];
  if (sentences.length > MAX_SENTENCES) violations.push("too-many-sentences");
  if (maxWordsPerSentence > MAX_WORDS_PER_SENTENCE) violations.push("sentence-too-long");
  if (hasNonLatinScript(text) || looksSpanish(text)) violations.push("not-english");
  if (idioms.length > 0) violations.push("idiom-or-phrasal");
  if (hasIdentityLeak(text)) violations.push("identity-leak");
  if (CORRECTION_PATTERNS.some((p) => p.test(text))) violations.push("corrects-learner");
  return { ok: violations.length === 0, violations, metrics };
}
