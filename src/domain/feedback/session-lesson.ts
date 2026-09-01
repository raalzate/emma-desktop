/**
 * Lección de cierre guardada junto a la conversación.
 *
 * El "why": la lección se generaba con el LLM cada vez que el aprendiz pulsaba
 * el cierre, así que reabrir una sesión terminada devolvía un texto DISTINTO
 * del que se leyó — y costaba una generación entera. Guardarla la vuelve parte
 * del histórico: lo que se revisa es lo que Emma dijo aquella vez.
 *
 * Los "próximos pasos" NO se guardan a propósito: dependen del estado actual de
 * la ruta del aprendiz (errores, SRS, escenarios pendientes), que ha cambiado
 * desde entonces. Se recalculan al abrir. Dominio puro.
 */

/** Decisión metodológica de Emma sobre la sesión (avanzar / superado / repetir). */
export interface LessonDecision {
  promoted: boolean;
  newLevel: string;
  passed: boolean;
}

export interface SessionLesson {
  /** Reporte en markdown que se muestra en el diálogo. */
  report: string;
  /** Lección hablada en inglés (audio + ayuda en español); null si no se generó. */
  lesson: string | null;
  /** Veredicto corto en español para el toast. */
  verdict: string;
  decision: LessonDecision;
  /** Cuándo se cerró la sesión (epoch ms). */
  at: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDecision(value: unknown): value is LessonDecision {
  if (!isRecord(value)) return false;
  return (
    typeof value.promoted === "boolean" &&
    typeof value.passed === "boolean" &&
    typeof value.newLevel === "string"
  );
}

/**
 * Guarda de borde: lo que vuelve del almacén JSON es entrada externa (un
 * archivo que alguien pudo editar o que quedó de una versión anterior). Sin
 * reporte no hay nada que revisar, así que la lección se descarta y la sesión
 * se comporta como si no la tuviera.
 */
export function isSessionLesson(value: unknown): value is SessionLesson {
  if (!isRecord(value)) return false;
  if (typeof value.report !== "string" || value.report.trim() === "") return false;
  if (value.lesson !== null && typeof value.lesson !== "string") return false;
  if (typeof value.verdict !== "string") return false;
  if (!isDecision(value.decision)) return false;
  return typeof value.at === "number" && Number.isFinite(value.at);
}
