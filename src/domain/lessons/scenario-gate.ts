/**
 * FR-006 — una escena que nació de una lección pendiente (recomendación de
 * cierre de sesión) debe practicarse antes de abrir escenas nuevas: la ruta
 * no es una parrilla libre mientras hay práctica sin cerrar.
 *
 * Con la lista vacía de lecciones pendientes, todo sigue como hoy (sin gate).
 * Con lecciones pendientes, sólo se permite: repetir una escena ya superada
 * (repaso libre) o entrar a la escena que es el objetivo de una lección de
 * tipo `scenario` pendiente. Cualquier otra escena queda bloqueada.
 */

import { pendingLessonTodos, type LessonTodo } from "./lesson-todo";

/** Motivo del bloqueo, en código — la vista traduce al texto de producto. */
export type ScenarioGateReason = "pending_todos";

export type ScenarioGateResult =
  | { allowed: true }
  | { allowed: false; reason: ScenarioGateReason };

export function canStartScenario(
  scenarioType: string,
  todos: readonly LessonTodo[],
  passedScenarios: readonly string[],
): ScenarioGateResult {
  const pending = pendingLessonTodos(todos);
  if (pending.length === 0) return { allowed: true };
  if (passedScenarios.includes(scenarioType)) return { allowed: true };
  const isTargetOfPendingScenario = pending.some(
    (t) => t.kind === "scenario" && t.target === scenarioType,
  );
  if (isTargetOfPendingScenario) return { allowed: true };
  return { allowed: false, reason: "pending_todos" };
}

export interface ScenarioSwitch {
  target: string;
  /** Escena abierta ahora en el chat. */
  current: string;
  todos: readonly LessonTodo[];
  passedScenarios: readonly string[];
}

/**
 * Cambio de escena desde el chat («Next scene», selector). Reiniciar la escena
 * abierta siempre se permite: ya pasó el gate al entrar, y el trazado del
 * chat puede no saber todavía que se acaba de superar.
 */
export function canSwitchScenario(change: ScenarioSwitch): ScenarioGateResult {
  if (change.target === change.current) return { allowed: true };
  return canStartScenario(change.target, change.todos, change.passedScenarios);
}
