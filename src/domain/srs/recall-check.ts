/**
 * Recuerdo activo en el repaso SRS: para tarjetas de producción el aprendiz
 * escribe la respuesta y el dominio la compara (en vez de sólo "mostrar y
 * autoevaluar"). También calcula cuándo vuelve la tarjeta y resume la sesión.
 */

import { normalizeAnswer } from "@/domain/exercises/evaluate-exercise";
import { editDistance } from "@/domain/exercises/answer-diagnosis";
import { isActionableCorrection, isRephrase, isTrivialCorrection } from "@/domain/chat/silent-error";
import { classifyError } from "@/domain/chat/error-taxonomy";
import { BOX_INTERVALS_DAYS, reviewCard, type LeitnerBox } from "./leitner";
import {
  LEGACY_PRODUCTION_PREFIXES,
  PRODUCTION_FRONT_PREFIX,
  type SrsCard,
  type SrsCardKind,
} from "./srs-card";

const QUOTED = /"([^"]+)"/;

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Palabra normalizada para comparar sin mayúsculas ni puntuación final. */
function normalizeWord(word: string): string {
  return normalizeAnswer(word);
}

/** Frase original (con el error) que el aprendiz escribió en la escena. */
function originalSentence(card: Pick<SrsCard, "front">): string {
  return card.front.match(QUOTED)?.[1] ?? "";
}

export interface RecallGaps {
  /** La frase corregida con `___` en cada palabra que no estaba en la original. */
  masked: string;
  /** Las palabras que faltan, en orden de aparición. */
  missing: string[];
}

/**
 * Huecos de una tarjeta de producción: las palabras de la corrección que no
 * estaban en lo que el aprendiz dijo. Null si no hay ninguna (la corrección fue
 * sólo de mayúsculas o puntuación) o si la tarjeta no es de producción.
 */
export function recallGaps(card: Pick<SrsCard, "kind" | "front" | "back">): RecallGaps | null {
  if (card.kind !== "sentence-production") return null;
  const known = new Set(words(originalSentence(card)).map(normalizeWord));
  const missing: string[] = [];
  const masked = words(card.back)
    .map((w) => {
      if (known.has(normalizeWord(w))) return w;
      missing.push(w);
      return "___";
    })
    .join(" ");
  return missing.length ? { masked, missing } : null;
}

/** Consigna de escribir la frase entera, para tarjetas sin huecos (y las viejas). */
function fullSentenceFront(card: Pick<SrsCard, "front">): string {
  const legacy = LEGACY_PRODUCTION_PREFIXES.find((p) => card.front.startsWith(p));
  return legacy ? PRODUCTION_FRONT_PREFIX + card.front.slice(legacy.length) : card.front;
}

/**
 * Frente a mostrar. Producción con huecos: la frase corregida con `___`, que es
 * lo que el aprendiz completa (llenar el hueco enseña más que reescribir todo).
 * Sin huecos: la consigna de escribir la frase entera.
 */
export function recallFront(card: Pick<SrsCard, "kind" | "front" | "back">): string {
  if (card.kind !== "sentence-production") return card.front;
  return recallGaps(card)?.masked ?? fullSentenceFront(card);
}

/** Lo que el aprendiz escribió en la escena, como contexto de la frase con huecos. */
export function recallContext(card: Pick<SrsCard, "kind" | "front">): string | null {
  if (card.kind !== "sentence-production") return null;
  return originalSentence(card) || null;
}

/**
 * Clave contra la que se compara lo escrito: si escribió tantas palabras como
 * huecos (o menos), se le compara con las palabras que faltan; si escribió más,
 * con la frase entera.
 */
export function recallTarget(card: Pick<SrsCard, "kind" | "front" | "back">, typed: string): string {
  const gaps = recallGaps(card);
  if (!gaps) return card.back;
  return words(typed).length <= gaps.missing.length ? gaps.missing.join(" ") : card.back;
}

export type RecallVerdict = "correct" | "near" | "wrong";

/** Hasta dos letras de diferencia dentro de una palabra es tipeo; más es otra palabra. */
const WORD_TYPO_MAX = 2;
/** Proporción de la clave que puede diferir en total (misma que en los ejercicios). */
const SENTENCE_TYPO_RATIO = 0.2;

/**
 * «Casi» = misma cantidad de palabras, ninguna reemplazada por otra (issues ≠
 * tasks aunque la frase se parezca) y pocas letras distintas en total: hasta
 * dos, o el 20 % de la clave si es más larga.
 */
function isNearSentence(expected: string, given: string): boolean {
  const e = words(expected);
  const g = words(given);
  if (e.length !== g.length) return false;
  const perWord = e.map((w, i) => editDistance(w, g[i]));
  if (perWord.some((d) => d > WORD_TYPO_MAX)) return false;
  const total = perWord.reduce((a, b) => a + b, 0);
  return total <= Math.max(WORD_TYPO_MAX, Math.floor(expected.length * SENTENCE_TYPO_RATIO));
}

export function checkRecall(card: Pick<SrsCard, "kind" | "front" | "back">, typed: string): RecallVerdict {
  const expected = normalizeAnswer(recallTarget(card, typed));
  const given = normalizeAnswer(typed);
  if (expected === given) return "correct";
  return isNearSentence(expected, given) ? "near" : "wrong";
}

/**
 * Tarjetas de producción guardadas cuando el corrector reformuló (sinónimos,
 * reescrituras) no enseñan nada: se saltan en el repaso. Las demás, siempre.
 */
export function isTeachableCard(card: Pick<SrsCard, "kind" | "front" | "back">): boolean {
  if (card.kind !== "sentence-production") return true;
  const original = originalSentence(card);
  if (!original) return true;
  const label = classifyError(original, card.back);
  const e = { label, original, corrected: card.back };
  return isActionableCorrection(e) && !isTrivialCorrection(label) && !isRephrase(e);
}

/** Tipos de tarjeta que se escriben; los de sonido se practican en voz alta. */
export function isTypedRecall(kind: SrsCardKind): boolean {
  return kind === "sentence-production" || kind === "chunk-cloze" || kind === "collocation";
}

const PROMPT_ES: Record<SrsCardKind, string> = {
  "sentence-production": "Write the corrected sentence in English: the original has a mistake.",
  "chunk-cloze": "Write what goes in the gap.",
  collocation: "Write the full combination in English.",
  "minimal-pair": "Say it out loud, then reveal and mark whether you knew it.",
  "word-stress": "Say it out loud stressing the strong syllable; reveal and mark whether you knew it.",
};

const GAPS_PROMPT = "Fill in the gaps to fix what you said: type the missing words, or the whole sentence.";

/** Qué hacer con la tarjeta (la consigna del repaso, en inglés). */
export function recallPromptEs(kind: SrsCardKind, card?: Pick<SrsCard, "kind" | "front" | "back">): string {
  if (kind === "sentence-production" && card && recallGaps(card)) return GAPS_PROMPT;
  return PROMPT_ES[kind];
}

/** Primera letra y longitud de una palabra: `w___`. */
function firstLetterScaffold(word: string): string {
  return word.length <= 1 ? word : word[0] + "_".repeat(word.length - 1);
}

/**
 * Pista sin regalar la clave. Producción con huecos: la frase con la primera
 * letra y longitud de cada palabra que falta (los huecos ya son la consigna).
 * Otras: primera letra y longitud de toda la clave.
 */
export function recallHint(card: Pick<SrsCard, "kind" | "front" | "back">): string {
  const gaps = recallGaps(card);
  if (gaps) {
    const known = new Set(words(originalSentence(card)).map(normalizeWord));
    return words(card.back)
      .map((w) => (known.has(normalizeWord(w)) ? w : firstLetterScaffold(w)))
      .join(" ");
  }
  return words(card.back).map(firstLetterScaffold).join(" ");
}

export interface WordVerdict {
  word: string;
  ok: boolean;
}

/**
 * Compara palabra a palabra la respuesta escrita contra la esperada. Devuelve
 * las palabras ESPERADAS marcando cuáles coinciden en su posición, para pintar
 * la corrección encima de la clave.
 */
export function wordDiff(expected: string, given: string): WordVerdict[] {
  const givenWords = words(given).map(normalizeWord);
  return words(expected).map((word, i) => ({
    word,
    ok: givenWords[i] !== undefined && givenWords[i] === normalizeWord(word),
  }));
}

export function nextReviewInDays(card: Pick<SrsCard, "box" | "id" | "lastReviewedDay">, correct: boolean): number {
  const next = reviewCard(card, correct, card.lastReviewedDay);
  return BOX_INTERVALS_DAYS[next.box as LeitnerBox];
}

export interface ReviewResult {
  cardId: string;
  correct: boolean;
  fromBox: LeitnerBox;
}

export interface ReviewSummary {
  reviewed: number;
  correct: number;
  /** Subieron de caja (sin contar las que ya estaban en la última). */
  promoted: number;
  /** Volvieron a la caja 1. */
  reset: number;
  /** Acertadas en la caja 5: ya dominadas. */
  mastered: number;
  messageEs: string;
}

const LAST_BOX: LeitnerBox = 5;

function reviewMessage(summary: Omit<ReviewSummary, "messageEs">): string {
  if (summary.reviewed === 0) return "Nothing to review today.";
  if (summary.reset === 0) return "All in place: no card went back to the start.";
  if (summary.correct >= summary.reviewed / 2) {
    return `${summary.reset} card(s) go back to box 1: you'll see them again tomorrow.`;
  }
  return "Tough day. The cards you missed come back tomorrow; the short daily review is what makes them stick.";
}

export function summarizeReview(results: readonly ReviewResult[]): ReviewSummary {
  const base = {
    reviewed: results.length,
    correct: results.filter((r) => r.correct).length,
    promoted: results.filter((r) => r.correct && r.fromBox < LAST_BOX).length,
    reset: results.filter((r) => !r.correct).length,
    mastered: results.filter((r) => r.correct && r.fromBox === LAST_BOX).length,
  };
  return { ...base, messageEs: reviewMessage(base) };
}
