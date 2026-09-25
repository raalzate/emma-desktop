/**
 * Lista de lecciones pendientes: lo que EMMA recomendó al cerrar una sesión y
 * el aprendiz cierra cuando quiere.
 *
 * El "why": «Próximos pasos» y «Tu reto de esta unidad» eran botones que
 * redirigían. Si el aprendiz no pulsaba en ese momento, la recomendación se
 * perdía (no se guardaba, se recalculaba); y si pulsaba, perdía la lectura del
 * feedback. Anotar en vez de ir resuelve las dos cosas.
 *
 * REGLA DURA: las lecciones nacen ÚNICAMENTE del feedback de cierre. Esto es un
 * registro de lo que EMMA recomendó, no una libreta libre — por eso aquí no hay
 * forma de crear una sin origen de sesión.
 *
 * Dominio puro: reglas de deduplicación y de transición, sin IO.
 */

/** Clase de lección, alineada con las recomendaciones de práctica + el reto de unidad. */
export type LessonTodoKind =
  | "exercise"
  | "srs-review"
  | "minimal-pair"
  | "scenario"
  | "checklist"
  | "challenge";

export type LessonTodoStatus = "pending" | "done" | "dismissed";

const KINDS: readonly LessonTodoKind[] = [
  "exercise",
  "srs-review",
  "minimal-pair",
  "scenario",
  "checklist",
  "challenge",
];
const STATUSES: readonly LessonTodoStatus[] = ["pending", "done", "dismissed"];

/** De qué sesión salió la lección: el aprendiz necesita recordar el porqué. */
export interface LessonTodoOrigin {
  /** Momento del cierre de la sesión que la generó. */
  sessionAt: number;
  scenarioType: string;
  scenarioTitle: string;
  situationTitle?: string;
}

export interface LessonTodo {
  id: string;
  kind: LessonTodoKind;
  /** Objetivo concreto (id de ejercicio, contraste, escenario, unidad…). */
  target: string;
  /** Título corto en español para la lista. */
  titleEs: string;
  /** Por qué EMMA la recomendó, tal como se lo dijo al aprendiz. */
  reasonEs: string;
  /** Deep-link al destino donde se hace la lección. */
  href: string;
  origin: LessonTodoOrigin;
  status: LessonTodoStatus;
  createdAt: number;
  /** Momento en que se completó o se descartó. */
  closedAt?: number;
}

/** Lo que el feedback anota; el id y las fechas los pone el dominio. */
export type LessonTodoDraft = Omit<LessonTodo, "id" | "status" | "createdAt" | "closedAt">;

/** Dos recomendaciones de la misma clase sobre el mismo objetivo son la misma lección. */
function sameLesson(a: { kind: LessonTodoKind; target: string }, b: LessonTodo): boolean {
  return a.kind === b.kind && a.target === b.target;
}

export function pendingLessonTodos(list: readonly LessonTodo[]): LessonTodo[] {
  return list.filter((t) => t.status === "pending");
}

/**
 * Anota la lección si no está ya pendiente. Una lección ya cerrada no bloquea:
 * si EMMA vuelve a recomendarla en otra sesión es porque el error volvió.
 */
export function addLessonTodo(
  list: readonly LessonTodo[],
  draft: LessonTodoDraft,
  now: number,
): LessonTodo[] {
  if (pendingLessonTodos(list).some((t) => sameLesson(draft, t))) return [...list];
  const todo: LessonTodo = {
    ...draft,
    id: `${draft.kind}:${draft.target}:${now}`,
    status: "pending",
    createdAt: now,
  };
  return [...list, todo];
}

/** Sólo una lección pendiente cambia de estado; lo demás deja la lista igual. */
function close(
  list: readonly LessonTodo[],
  id: string,
  status: Exclude<LessonTodoStatus, "pending">,
  now: number,
): LessonTodo[] {
  return list.map((t) =>
    t.id === id && t.status === "pending" ? { ...t, status, closedAt: now } : t,
  );
}

export function completeLessonTodo(
  list: readonly LessonTodo[],
  id: string,
  now: number,
): LessonTodo[] {
  return close(list, id, "done", now);
}

export function dismissLessonTodo(
  list: readonly LessonTodo[],
  id: string,
  now: number,
): LessonTodo[] {
  return close(list, id, "dismissed", now);
}

/**
 * Guarda del borde: lo que viene del store JSON puede ser de una versión
 * anterior o estar editado a mano. Una entrada que no cumple se descarta en vez
 * de romper la lista.
 */
export function isLessonTodo(value: unknown): value is LessonTodo {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  const origin = t.origin as Record<string, unknown> | undefined;
  return (
    typeof t.id === "string" &&
    typeof t.target === "string" &&
    typeof t.titleEs === "string" &&
    typeof t.reasonEs === "string" &&
    typeof t.href === "string" &&
    typeof t.createdAt === "number" &&
    KINDS.includes(t.kind as LessonTodoKind) &&
    STATUSES.includes(t.status as LessonTodoStatus) &&
    typeof origin === "object" &&
    origin !== null &&
    typeof origin.sessionAt === "number" &&
    typeof origin.scenarioType === "string" &&
    typeof origin.scenarioTitle === "string"
  );
}
