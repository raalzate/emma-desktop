/**
 * Análisis enriquecido de un ítem tras responder («Explain with Emma»): la
 * palabra, cómo suena, qué significa, por qué esa respuesta y un ejemplo. Es
 * el puente al español del Artículo 9: se pide explícitamente y se muestra
 * como contenido, no como UI.
 *
 * Dominio puro: arma el prompt y parsea la salida `KEY: value` con tolerancia
 * a la deriva del modelo pequeño (negritas, viñetas, CRLF). La validación del
 * borde vive aquí también: sin traducción o sin porqué no hay explicación.
 */

import { z } from "zod";
import type { ExerciseItem, UnitExercise } from "./exercise";

export interface ItemExplanation {
  word: string;
  ipa?: string;
  translationEs: string;
  whyEs: string;
  exampleEn?: string;
  exampleEs?: string;
}

const SYSTEM =
  "You are EMMA, an English tutor for Spanish-speaking software engineers. " +
  "The learner just answered an exercise item. Explain the target word or form in a compact, " +
  "structured way. Reply with EXACTLY these lines and nothing else:\n" +
  "WORD: the target word or form in English\n" +
  "IPA: its pronunciation in IPA, between slashes\n" +
  "TRANSLATION: its meaning in Spanish (one short line)\n" +
  "WHY: in Spanish, why the correct answer is right (and, if the learner was wrong, what their answer would mean or why it fails), 1–2 sentences\n" +
  "EXAMPLE: one short natural sentence in English using it in a software context\n" +
  "EXAMPLE_ES: that sentence in Spanish\n" +
  "No markdown, no extra commentary.";

export function explanationPrompt(args: {
  exercise: Pick<UnitExercise, "promptEs" | "kind">;
  item: ExerciseItem;
  given: string;
}): { system: string; prompt: string } {
  const correct = [args.item.answer, ...(args.item.altAnswers ?? [])];
  const wrong = !correct.some((a) => a.trim().toLowerCase() === args.given.trim().toLowerCase());
  const lines = [
    `Exercise instruction (Spanish): ${args.exercise.promptEs}`,
    `Item: ${args.item.stem}`,
    `Correct answer: ${args.item.answer}`,
    ...(wrong ? [`Learner answered: ${args.given}`] : []),
    ...(args.item.noteEs ? [`Answer key note (Spanish): ${args.item.noteEs}`] : []),
  ];
  return { system: SYSTEM, prompt: lines.join("\n") };
}

const KEYS = ["WORD", "IPA", "TRANSLATION", "WHY", "EXAMPLE_ES", "EXAMPLE"] as const;
type Key = (typeof KEYS)[number];

/** `- **WHY:** texto` → ["WHY", "texto"]; una línea sin clave devuelve null. */
function keyed(line: string): [Key, string] | null {
  const clean = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/\*+/g, "").trim();
  for (const key of KEYS) {
    if (clean.toUpperCase().startsWith(`${key}:`)) return [key, clean.slice(key.length + 1).trim()];
  }
  return null;
}

const ExplanationSchema = z.object({
  word: z.string().trim().min(1),
  ipa: z.string().trim().min(1).optional(),
  translationEs: z.string().trim().min(1),
  whyEs: z.string().trim().min(1),
  exampleEn: z.string().trim().min(1).optional(),
  exampleEs: z.string().trim().min(1).optional(),
});

export function parseExplanation(raw: string): ItemExplanation | null {
  const found: Partial<Record<Key, string>> = {};
  for (const line of raw.split(/\r\n|\r|\n/)) {
    const pair = keyed(line);
    if (pair && pair[1] && !found[pair[0]]) found[pair[0]] = pair[1];
  }
  const candidate = {
    word: found.WORD,
    ipa: found.IPA,
    translationEs: found.TRANSLATION,
    whyEs: found.WHY,
    exampleEn: found.EXAMPLE,
    exampleEs: found.EXAMPLE_ES,
  };
  const parsed = ExplanationSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
