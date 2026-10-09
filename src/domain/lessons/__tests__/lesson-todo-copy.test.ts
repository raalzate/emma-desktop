/**
 * Las lecciones guardadas antes del cambio a UI en inglés (Artículo 9 v1.6.0)
 * llevan título y motivo en español dentro del store. El título sale de la
 * clase (es siempre el mismo) y los motivos conocidos se traducen al vuelo;
 * lo que no se reconoce (instrucciones de un reto, contenido del libro) se
 * muestra tal cual.
 */

import { describe, it, expect } from "vitest";
import { lessonTodoTitle, lessonTodoReason } from "../lesson-todo-copy";
import type { LessonTodo } from "../lesson-todo";

const base: LessonTodo = {
  id: "x",
  kind: "srs-review",
  target: "due",
  titleEs: "Repaso de tus tarjetas",
  reasonEs: "16 tarjetas pendientes de repaso",
  href: "/practice?tab=srs",
  origin: { sessionAt: 1, scenarioType: "daily_standup", scenarioTitle: "Daily Standup" },
  status: "pending",
  createdAt: 1,
};

describe("lessonTodoTitle", () => {
  it("el título sale de la clase, aunque el guardado esté en español", () => {
    expect(lessonTodoTitle(base)).toBe("Review your cards");
    expect(lessonTodoTitle({ ...base, kind: "minimal-pair", titleEs: "Par mínimo de pronunciación" })).toBe(
      "Pronunciation minimal pair",
    );
    expect(lessonTodoTitle({ ...base, kind: "exercise", titleEs: "Ejercicio de la unidad" })).toBe("Unit exercise");
    expect(lessonTodoTitle({ ...base, kind: "scenario", titleEs: "Escenario de conversación" })).toBe(
      "Conversation scenario",
    );
  });
  it("el reto lleva el número de unidad del objetivo", () => {
    expect(lessonTodoTitle({ ...base, kind: "challenge", target: "unit-4", titleEs: "Reto de la unidad 4" })).toBe(
      "Unit 4 challenge",
    );
  });
});

describe("lessonTodoReason", () => {
  it("traduce los motivos que el recomendador escribía en español", () => {
    expect(lessonTodoReason(base)).toBe("16 cards due for review");
    expect(
      lessonTodoReason({ ...base, reasonEs: "la unidad activa entrena /ɪ/ vs /iː/: practica el par mínimo" }),
    ).toBe("your active unit trains /ɪ/ vs /iː/: practice the minimal pair");
    expect(lessonTodoReason({ ...base, reasonEs: "débil en article → ejercicio 1A de la unidad 1" })).toBe(
      "weak in article → exercise 1A from unit 1",
    );
    expect(lessonTodoReason({ ...base, reasonEs: 'débil en preposition → practica el escenario "code_review"' })).toBe(
      'weak in preposition → practice the "code_review" scenario',
    );
  });
  it("lo que ya está en inglés o no se reconoce se muestra tal cual", () => {
    expect(lessonTodoReason({ ...base, reasonEs: "5 cards due for review" })).toBe("5 cards due for review");
    expect(lessonTodoReason({ ...base, reasonEs: "Escribe tu actualización de estado real." })).toBe(
      "Escribe tu actualización de estado real.",
    );
  });
});
