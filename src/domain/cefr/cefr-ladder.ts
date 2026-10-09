/** Orden CEFR + siguiente nivel para el motor de progresión. */

export const CEFR_LADDER = ["A1", "A2", "B1", "B2", "C1"] as const;

export type CefrLevel = (typeof CEFR_LADDER)[number];

/** Nivel CEFR inicial: todos arrancan en A1 y suben por escenarios. */
export const INITIAL_LEVEL: CefrLevel = "A1";

export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === "string" && (CEFR_LADDER as readonly string[]).includes(value);
}

/** Número de nivel propio (A1→1 … C1→5) o null si el valor no es de la escala. */
export function levelNumber(cefr: string | null | undefined): number | null {
  if (!isCefrLevel(cefr)) return null;
  return CEFR_LADDER.indexOf(cefr) + 1;
}

/** Etiqueta visible «Level N»; la app no muestra códigos CEFR. Vacía si es desconocido. */
export function levelLabel(cefr: string | null | undefined): string {
  const n = levelNumber(cefr);
  return n === null ? "" : `Level ${n}`;
}

/** Nivel sobre *current*, o null si está tope o es desconocido. */
export function nextLevel(current: string | null | undefined): CefrLevel | null {
  if (!isCefrLevel(current)) return null;
  const idx = CEFR_LADDER.indexOf(current);
  if (idx >= CEFR_LADDER.length - 1) return null;
  return CEFR_LADDER[idx + 1];
}
