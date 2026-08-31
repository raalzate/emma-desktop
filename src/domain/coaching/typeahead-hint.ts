/**
 * Cuánto del autocompletar se muestra según el nivel del aprendiz.
 *
 * El "why": completar la frase entera es el mismo atajo por el que las
 * sugerencias dejaron de ser clicables — el aprendiz envía inglés que no
 * produjo. En A1–A2 el andamiaje completo ayuda a arrancar y a ver la forma; a
 * partir de B1 basta un empujón de dos palabras para desbloquear y que el resto
 * lo escriba él (output forzado, Swain). Dominio puro.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

/** Palabras de pista a partir de B1. */
export const HINT_WORDS_ADVANCED = 2;

const FULL_SUFFIX_LEVELS: readonly CefrLevel[] = ["A1", "A2"];

export function hintForLevel(suffix: string, level: CefrLevel): string {
  if (!suffix.trim()) return "";
  if (FULL_SUFFIX_LEVELS.includes(level)) return suffix;
  // Se preserva el espacio inicial: es lo que separa la pista del texto escrito.
  const leading = /^\s*/.exec(suffix)?.[0] ?? "";
  const words = suffix.trim().split(/\s+/);
  return leading + words.slice(0, HINT_WORDS_ADVANCED).join(" ");
}
