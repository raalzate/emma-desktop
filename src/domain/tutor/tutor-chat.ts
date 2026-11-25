/**
 * Chat de apoyo con EMMA durante la práctica (#357, T8).
 *
 * El "why": en la práctica el aprendiz no tenía a quién preguntarle «¿cómo se
 * dice…?» o «explícame esto». Este chat es andamiaje, como «Help in Spanish»:
 * no es la conversación de práctica (que sigue 100 % en inglés), así que
 * responde en el idioma en que se le pregunta y deja los ejemplos en inglés.
 * Dominio puro: arma el prompt y valida la entrada.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

export interface TutorTurn {
  role: "user" | "assistant";
  content: string;
}

const MAX_QUESTION_CHARS = 800;
const HISTORY_TURNS = 6;

export const TUTOR_SYSTEM =
  "You are EMMA, a friendly English tutor for Spanish-speaking software engineers. " +
  "The learner is practicing and asks you for help: translate something, explain a " +
  "word, a grammar point or a pronunciation, or check a sentence. Answer in the same " +
  "language the learner used (Spanish or English). Keep it short: at most 4 short " +
  "sentences or a tiny list. Give examples in English, adapted to the learner's level " +
  "and to software work. No markdown headers, no preamble.";

/** Entrada externa (lo que tipeó el aprendiz): recortada, no vacía y acotada. */
export function validTutorQuestion(raw: string): string | null {
  const q = raw.trim();
  if (!q || q.length > MAX_QUESTION_CHARS) return null;
  return q;
}

export function buildTutorPrompt(a: { question: string; level: CefrLevel; history: readonly TutorTurn[] }): string {
  const recent = a.history.slice(-HISTORY_TURNS);
  const transcript = recent.map((t) => `${t.role === "user" ? "Learner" : "EMMA"}: ${t.content}`).join("\n");
  return (
    `Learner level: ${a.level}\n` +
    (transcript ? `Conversation so far:\n${transcript}\n\n` : "") +
    `Learner asks: ${a.question}\n\nEMMA:`
  );
}
