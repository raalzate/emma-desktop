/**
 * Nivel de jugador (#216, FR-002): independiente del nivel MCER. El MCER sube
 * despacio y por desempeño; este sube con la constancia, para que cada sesión
 * se note. Curva: XP acumulado para alcanzar el nivel n = 50·n·(n−1).
 */

const CURVE_FACTOR = 50;

const TITLES = [
  "Newcomer",
  "Listener",
  "Speaker",
  "Conversationalist",
  "Storyteller",
  "Communicator",
  "Negotiator",
  "Presenter",
  "Mentor",
  "Fluent Voice",
] as const;

const LAST_TITLE = "Legend";

export interface PlayerLevel {
  level: number;
  title: string;
  totalXp: number;
  /** XP ganado desde el umbral del nivel actual. */
  xpIntoLevel: number;
  /** XP que separa el nivel actual del siguiente. */
  xpForLevel: number;
  /** 0–1 dentro del nivel actual. */
  progress: number;
}

export function xpToReachLevel(level: number): number {
  return CURVE_FACTOR * level * (level - 1);
}

/** Inverso de la curva: el mayor n con 50·n·(n−1) ≤ xp. */
function levelForXp(xp: number): number {
  const n = Math.floor((1 + Math.sqrt(1 + (4 * xp) / CURVE_FACTOR)) / 2);
  // Corrige el redondeo de punto flotante en los umbrales exactos.
  if (xpToReachLevel(n + 1) <= xp) return n + 1;
  if (xpToReachLevel(n) > xp) return n - 1;
  return n;
}

export function titleForLevel(level: number): string {
  return TITLES[level - 1] ?? LAST_TITLE;
}

export function playerLevelFromXp(totalXp: number): PlayerLevel {
  const xp = Math.max(0, Number.isFinite(totalXp) ? totalXp : 0);
  const level = levelForXp(xp);
  const floor = xpToReachLevel(level);
  const xpForLevel = xpToReachLevel(level + 1) - floor;
  const xpIntoLevel = xp - floor;
  return {
    level,
    title: titleForLevel(level),
    totalXp: xp,
    xpIntoLevel,
    xpForLevel,
    progress: xpIntoLevel / xpForLevel,
  };
}
