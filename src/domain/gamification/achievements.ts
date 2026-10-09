/**
 * Catálogo de logros (#216, FR-005). Cada logro es una métrica numérica sobre
 * las estadísticas y una meta: así el bloqueado puede mostrar cuánto falta, no
 * sólo un candado. Título y descripción son texto de producto (inglés); la
 * pista `hintEs` es el tooltip en español (Artículo 9).
 */

import type { GamificationStats } from "./gamification-stats";

export type AchievementIcon =
  | "message"
  | "messages"
  | "sparkles"
  | "flame"
  | "calendar"
  | "zap"
  | "clapperboard"
  | "trending-up"
  | "dumbbell"
  | "brain"
  | "ear"
  | "trophy"
  | "book-check"
  | "star"
  | "crown";

export type AchievementTier = "bronze" | "silver" | "gold";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  hintEs: string;
  icon: AchievementIcon;
  tier: AchievementTier;
  goal: number;
  metric: (s: GamificationStats) => number;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first-words",
    title: "First words",
    description: "Finish your first conversation.",
    hintEs: "Terminá tu primera conversación con EMMA",
    icon: "message",
    tier: "bronze",
    goal: 1,
    metric: (s) => s.counts.conversation,
  },
  {
    id: "clean-sheet",
    title: "Clean sheet",
    description: "Finish a conversation without errors.",
    hintEs: "Cerrá una conversación sin ningún error",
    icon: "sparkles",
    tier: "silver",
    goal: 1,
    metric: (s) => s.cleanSessions,
  },
  {
    id: "on-fire",
    title: "On fire",
    description: "Practice 3 days in a row.",
    hintEs: "Practicá tres días seguidos",
    icon: "flame",
    tier: "bronze",
    goal: 3,
    metric: (s) => s.bestStreak,
  },
  {
    id: "week-warrior",
    title: "Week warrior",
    description: "Practice 7 days in a row.",
    hintEs: "Practicá siete días seguidos",
    icon: "calendar",
    tier: "silver",
    goal: 7,
    metric: (s) => s.bestStreak,
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    description: "Practice 30 days in a row.",
    hintEs: "Practicá treinta días seguidos",
    icon: "zap",
    tier: "gold",
    goal: 30,
    metric: (s) => s.bestStreak,
  },
  {
    id: "regular",
    title: "Regular",
    description: "Finish 10 conversations.",
    hintEs: "Terminá diez conversaciones",
    icon: "messages",
    tier: "silver",
    goal: 10,
    metric: (s) => s.counts.conversation,
  },
  {
    id: "scene-stealer",
    title: "Scene stealer",
    description: "Pass a scenario on your path.",
    hintEs: "Superá un escenario de tu ruta",
    icon: "clapperboard",
    tier: "bronze",
    goal: 1,
    metric: (s) => s.counts["scenario-passed"],
  },
  {
    id: "moving-up",
    title: "Moving up",
    description: "Reach a new English level.",
    hintEs: "Subí de nivel de inglés",
    icon: "trending-up",
    tier: "gold",
    goal: 1,
    metric: (s) => s.counts["level-up"],
  },
  {
    id: "drill-sergeant",
    title: "Drill sergeant",
    description: "Answer 50 exercise items.",
    hintEs: "Respondé cincuenta ítems de ejercicios",
    icon: "dumbbell",
    tier: "silver",
    goal: 50,
    metric: (s) => s.counts.exercise,
  },
  {
    id: "memory-keeper",
    title: "Memory keeper",
    description: "Review 100 cards.",
    hintEs: "Repasá cien tarjetas",
    icon: "brain",
    tier: "silver",
    goal: 100,
    metric: (s) => s.counts.review,
  },
  {
    id: "sharp-ear",
    title: "Sharp ear",
    description: "Practice 25 minimal pairs.",
    hintEs: "Practicá veinticinco pares mínimos de pronunciación",
    icon: "ear",
    tier: "bronze",
    goal: 25,
    metric: (s) => s.counts.pronunciation,
  },
  {
    id: "challenger",
    title: "Challenger",
    description: "Submit your first writing challenge.",
    hintEs: "Entregá tu primer reto de escritura",
    icon: "trophy",
    tier: "bronze",
    goal: 1,
    metric: (s) => s.counts.challenge,
  },
  {
    id: "homework-hero",
    title: "Homework hero",
    description: "Complete 5 lessons from your list.",
    hintEs: "Completá cinco lecciones de tu lista",
    icon: "book-check",
    tier: "silver",
    goal: 5,
    metric: (s) => s.counts.lesson,
  },
  {
    id: "thousand-club",
    title: "Thousand club",
    description: "Earn 1,000 XP.",
    hintEs: "Juntá mil puntos de experiencia",
    icon: "star",
    tier: "silver",
    goal: 1000,
    metric: (s) => s.totalXp,
  },
  {
    id: "high-achiever",
    title: "High achiever",
    description: "Earn 5,000 XP.",
    hintEs: "Juntá cinco mil puntos de experiencia",
    icon: "crown",
    tier: "gold",
    goal: 5000,
    metric: (s) => s.totalXp,
  },
];

export interface AchievementStatus {
  achievement: Achievement;
  unlocked: boolean;
  /** 0–1 hacia la meta. */
  progress: number;
  /** Valor actual de la métrica, acotado a la meta. */
  current: number;
}

export function achievementStatus(stats: GamificationStats): AchievementStatus[] {
  return ACHIEVEMENTS.map((achievement) => {
    const value = Math.max(0, achievement.metric(stats));
    const current = Math.min(value, achievement.goal);
    return { achievement, unlocked: value >= achievement.goal, progress: current / achievement.goal, current };
  });
}

/** Logros que `after` tiene y `before` no: lo único que merece celebración. */
export function newlyUnlocked(before: GamificationStats, after: GamificationStats): Achievement[] {
  const had = new Set(
    achievementStatus(before)
      .filter((s) => s.unlocked)
      .map((s) => s.achievement.id),
  );
  return achievementStatus(after)
    .filter((s) => s.unlocked && !had.has(s.achievement.id))
    .map((s) => s.achievement);
}
