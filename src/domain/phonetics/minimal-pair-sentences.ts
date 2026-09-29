/**
 * Oraciones cortas por nivel para pares mínimos (H8, §1.3): en vez de pedir
 * la palabra suelta, "Say it" pide una frase natural de contexto IT/trabajo
 * que contenga la palabra objetivo — así el contraste sigue siendo audible
 * pero la práctica se acerca al habla real. Dominio puro: sin IO.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { MinimalPair } from "@/domain/phonetics/phonetics";

export type SentenceBand = "short" | "medium" | "long";

/** A1–A2 → oraciones de 4-6 palabras; B1 → 7-10; B2-C1 → 11-16 (aprox). */
export function bandForLevel(level: CefrLevel): SentenceBand {
  if (level === "A1" || level === "A2") return "short";
  if (level === "B1") return "medium";
  return "long";
}

/**
 * Extrae la forma hablable de un campo de `MinimalPair`: quita anotaciones
 * entre paréntesis («close (verbo, cerrar)» → «close») y se queda con la
 * primera alternativa si hay varias separadas por «/» («cash / cache» → «cash»).
 */
function speakableWord(raw: string): string {
  return raw.split(/[/(]/)[0].trim();
}

/** Oraciones autoradas a mano para los pares citados como ejemplo (calidad de referencia). */
const AUTHORED: Record<string, Record<SentenceBand, string>> = {
  bit: {
    short: "Wait a bit.",
    medium: "Can you wait a bit before the deploy?",
    long: "Can you please wait a bit longer before you trigger the production deploy?",
  },
  beat: {
    short: "Our team beat the deadline.",
    medium: "Our whole team beat the deadline again this sprint.",
    long: "Somehow our whole engineering team beat the tight deadline again this sprint.",
  },
  live: {
    short: "It's live now.",
    medium: "The new feature is finally live in production.",
    long: "After weeks of testing, the new feature is finally live in production for every user.",
  },
  leave: {
    short: "I have to leave.",
    medium: "Can I leave the stand-up a bit early today?",
    long: "I'm sorry, but I have to leave the meeting early to catch a client call.",
  },
  stack: {
    short: "The stack is broken.",
    medium: "The whole stack is broken after that last merge.",
    long: "The whole stack has been broken since someone merged that change without running the tests.",
  },
  stuck: {
    short: "It's stuck again.",
    medium: "The deploy pipeline is stuck again this morning.",
    long: "The deploy pipeline has been stuck again this morning, and nobody can figure out why.",
  },
  ship: {
    short: "We ship on Friday.",
    medium: "We're shipping this feature on Friday.",
    long: "We're planning to ship this whole feature to production on Friday afternoon.",
  },
  chip: {
    short: "Check the chip specs.",
    medium: "Can you check the chip specs before we order it?",
    long: "Can you please check the chip specs one more time before we place the hardware order?",
  },
};

/** Plantillas genéricas: siempre gramaticales y contienen la palabra citada. */
const TEMPLATES: Record<SentenceBand, (word: string) => string> = {
  short: (word) => `Can you say "${word}" clearly?`,
  medium: (word) => `Could you please say "${word}" one more time for me?`,
  long: (word) => `During the code review, please pronounce "${word}" slowly so the team understands you.`,
};

/**
 * Oración natural que contiene la palabra del lado `side` del par, ajustada a
 * la banda del `level`. Si el campo no tiene letras (par asimétrico, p. ej.
 * `"—"`), cae al valor crudo tal cual — no hay palabra que oracionar.
 */
export function sentenceForPair(pair: MinimalPair, side: "a" | "b", level: CefrLevel): string {
  const raw = side === "a" ? pair.a : pair.b;
  const word = speakableWord(raw);
  if (!/[a-zA-Z]/.test(word)) return raw;

  const band = bandForLevel(level);
  const authored = AUTHORED[word.toLowerCase()];
  if (authored) return authored[band];

  return TEMPLATES[band](word);
}
