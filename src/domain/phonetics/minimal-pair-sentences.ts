/**
 * Oraciones cortas por nivel para pares mínimos (H8, §1.3): en vez de pedir
 * la palabra suelta, "Say it" pide una frase natural de contexto IT/trabajo
 * que contenga la palabra objetivo — así el contraste sigue siendo audible
 * pero la práctica se acerca al habla real. Dominio puro: sin IO.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { MinimalPair } from "@/domain/phonetics/phonetics";
import { AUTHORED_SENTENCES } from "@/lib/minimal-pair-sentences-data";

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

/**
 * Oraciones autoradas a mano, una por palabra hablable y banda: cubren TODAS
 * las palabras de `SOUND_CONTRASTS` (`@/lib/phonetics-data`), no solo un
 * puñado de ejemplo — ver `@/lib/minimal-pair-sentences-data`. La plantilla
 * genérica de abajo queda como último recurso para palabras fuera de esos
 * datos (hoy inalcanzable desde `SOUND_CONTRASTS`, pero cubre pares nuevos
 * que aún no tengan autoría).
 */
const AUTHORED: Record<string, Record<SentenceBand, string>> = AUTHORED_SENTENCES;

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
