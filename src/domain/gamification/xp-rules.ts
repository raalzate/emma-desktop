/**
 * Tabla de XP (#216, FR-001): cuánto vale cada actividad de práctica. Vive en
 * el dominio para que la recompensa sea una regla explícita y probada, no un
 * número suelto en cada componente que la otorga.
 */

export type XpActivity =
  | { kind: "conversation"; turns: number; errors: number }
  | { kind: "scenario-passed" }
  | { kind: "level-up" }
  | { kind: "exercise"; correct: boolean }
  | { kind: "review" }
  | { kind: "pronunciation"; correct: boolean }
  | { kind: "challenge" }
  | { kind: "lesson" };

export type XpActivityKind = XpActivity["kind"];

export const XP_ACTIVITY_KINDS: readonly XpActivityKind[] = [
  "conversation",
  "scenario-passed",
  "level-up",
  "exercise",
  "review",
  "pronunciation",
  "challenge",
  "lesson",
];

export interface XpLine {
  label: string;
  xp: number;
}

const CONVERSATION_BASE = 20;
const XP_PER_TURN = 2;
const MAX_SCORED_TURNS = 20;
const CLEAN_SESSION_BONUS = 10;

/** Turnos que suman: enteros, no negativos y con tope (una sesión eterna no rinde más). */
function scoredTurns(turns: number): number {
  if (!Number.isFinite(turns) || turns <= 0) return 0;
  return Math.min(Math.floor(turns), MAX_SCORED_TURNS);
}

function conversationLines(turns: number, errors: number): XpLine[] {
  const counted = scoredTurns(turns);
  const lines: XpLine[] = [{ label: "Conversation", xp: CONVERSATION_BASE }];
  if (counted > 0) lines.push({ label: `${counted} turns`, xp: counted * XP_PER_TURN });
  // Sin turnos no hay sesión que juzgar: el bono no se regala.
  if (counted > 0 && errors === 0) lines.push({ label: "Clean session", xp: CLEAN_SESSION_BONUS });
  return lines;
}

/** Desglose legible del XP de una actividad (las líneas suman `xpFor`). */
export function xpBreakdown(activity: XpActivity): XpLine[] {
  switch (activity.kind) {
    case "conversation":
      return conversationLines(activity.turns, activity.errors);
    case "scenario-passed":
      return [{ label: "Scenario passed", xp: 30 }];
    case "level-up":
      return [{ label: "Level up", xp: 100 }];
    case "exercise":
      return [{ label: activity.correct ? "Exercise correct" : "Exercise attempt", xp: activity.correct ? 5 : 1 }];
    case "review":
      return [{ label: "Card reviewed", xp: 3 }];
    case "pronunciation":
      return [{ label: activity.correct ? "Sound recognized" : "Sound attempt", xp: activity.correct ? 4 : 1 }];
    case "challenge":
      return [{ label: "Challenge submitted", xp: 25 }];
    case "lesson":
      return [{ label: "Lesson completed", xp: 10 }];
  }
}

export function xpFor(activity: XpActivity): number {
  return xpBreakdown(activity).reduce((sum, line) => sum + line.xp, 0);
}

/** Actividades que otorga el cierre de una conversación (#216, H6). */
export function sessionActivities(s: {
  turns: number;
  errors: number;
  passed: boolean;
  promoted: boolean;
}): XpActivity[] {
  const activities: XpActivity[] = [{ kind: "conversation", turns: s.turns, errors: s.errors }];
  if (s.passed) activities.push({ kind: "scenario-passed" });
  if (s.promoted) activities.push({ kind: "level-up" });
  return activities;
}
