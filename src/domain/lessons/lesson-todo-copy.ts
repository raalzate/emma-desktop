/**
 * Copy de una lección en la lista, en inglés (Artículo 9 v1.6.0). El título
 * depende sólo de la clase, así que se deriva y no se lee del store; el motivo
 * se guardó tal como el recomendador lo escribió y, si es de una versión que
 * escribía en español, se traduce al vuelo. Lo que no se reconoce (las
 * instrucciones de un reto son contenido del libro) se muestra tal cual.
 */

import type { LessonTodo, LessonTodoKind } from "./lesson-todo";

const TITLE_BY_KIND: Record<Exclude<LessonTodoKind, "challenge">, string> = {
  exercise: "Unit exercise",
  "srs-review": "Review your cards",
  "minimal-pair": "Pronunciation minimal pair",
  scenario: "Conversation scenario",
};

export function lessonTodoTitle(todo: Pick<LessonTodo, "kind" | "target" | "titleEs">): string {
  if (todo.kind === "challenge") {
    const unit = todo.target.match(/^unit-(\d+)$/)?.[1];
    return unit ? `Unit ${unit} challenge` : todo.titleEs;
  }
  return TITLE_BY_KIND[todo.kind];
}

/** Motivos que el recomendador escribía en español antes de v1.6.0. */
const LEGACY_REASONS: readonly [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^(\d+) tarjetas pendientes de repaso$/, (m) => `${m[1]} cards due for review`],
  [
    /^la unidad activa entrena (.+): practica el par mínimo$/,
    (m) => `your active unit trains ${m[1]}: practice the minimal pair`,
  ],
  [
    /^débil en (\S+) → ejercicio (\S+) de la unidad (\d+)$/,
    (m) => `weak in ${m[1]} → exercise ${m[2]} from unit ${m[3]}`,
  ],
  [/^débil en (\S+) → practica el escenario "([^"]+)"$/, (m) => `weak in ${m[1]} → practice the "${m[2]}" scenario`],
];

export function lessonTodoReason(todo: Pick<LessonTodo, "reasonEs">): string {
  const reason = todo.reasonEs.trim();
  for (const [re, toEnglish] of LEGACY_REASONS) {
    const m = reason.match(re);
    if (m) return toEnglish(m);
  }
  return todo.reasonEs;
}
