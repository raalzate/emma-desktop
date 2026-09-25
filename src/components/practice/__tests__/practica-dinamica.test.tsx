/**
 * Prácticas dinámicas: la UI de ejercicios, retos, repaso y el panel «Hoy»
 * pintan lo que el dominio decide (progreso, pista, rúbrica, recuerdo
 * activo, plan del día), en español y con los tokens del rediseño.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { PracticeToday } from "@/components/practice/practice-today";
import { ExerciseDrill } from "@/components/practice/exercise-drill";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { buildPracticeToday } from "@/domain/practice/practice-today";

const PRACTICE_DIR = path.join(process.cwd(), "src/components/practice");

function source(file: string): string {
  return fs.readFileSync(path.join(PRACTICE_DIR, file), "utf8");
}

describe("panel «Hoy»", () => {
  it("lista los pasos del plan en orden con su contador y abre la pestaña al elegir", () => {
    const plan = buildPracticeToday({
      dueCards: 4,
      challenges: { done: 1, total: 72 },
      nextChallengeId: 2,
      activeUnit: 3,
    });
    const html = renderToStaticMarkup(createElement(PracticeToday, { plan, onPick: () => undefined }));
    expect(html).toContain("Hoy");
    expect(html).toContain(plan.headlineEs);
    expect(html.indexOf("Repaso espaciado")).toBeLessThan(html.indexOf("Ejercicios de la unidad 3"));
    expect(html).toContain("Reto 2");
    expect(html).toContain(">4<");
    expect((html.match(/<button/g) ?? []).length).toBe(plan.steps.length);
  });

  it("sin plan muestra un placeholder, no un panel vacío", () => {
    const html = renderToStaticMarkup(createElement(PracticeToday, { plan: null, onPick: () => undefined }));
    expect(html).toContain("animate-pulse");
    expect(html).not.toContain("Hoy");
  });
});

describe("ejercicios (drill)", () => {
  const runtime = { repos: { srs: { loadCards: async () => [], saveCards: async () => undefined } } } as unknown as EmmaRuntime;

  it("abre un ejercicio por deep-link mostrando el stem, el progreso y la pista disponible", () => {
    const html = renderToStaticMarkup(
      createElement(ExerciseDrill, { runtime, initialUnit: 14, initialExerciseId: "14A" }),
    );
    expect(html).toContain("14A");
    expect(html).toContain("1 / 7");
    expect(html).toContain("By the time he ____ (be) paged");
    expect(html).toContain("Pista");
    expect(html).toContain("Corregir");
    // La clave nunca se muestra antes de intentar.
    expect(html).not.toContain("had already reached");
  });

  it("sin deep-link lista los ejercicios de la unidad con su tipo en español", () => {
    const html = renderToStaticMarkup(createElement(ExerciseDrill, { runtime, initialUnit: 14 }));
    expect(html).toContain("Completar");
    expect(html).toContain("ítems");
  });

  it("no quedan colores Tailwind crudos: usa los tokens scaffold", () => {
    const src = source("exercise-drill.tsx");
    expect(src).not.toMatch(/\b(green|red|emerald|rose)-\d{2,3}\b/);
    expect(src).toContain("bg-scaffold-easy-bg");
    expect(src).toContain("bg-scaffold-hard-bg");
  });
});

// Retos y repaso necesitan datos del store (IPC) para llegar al detalle: la
// pedagogía está probada en dominio/aplicación; acá sólo se fija el cableado.
describe("retos", () => {
  const src = source("challenge-view.tsx");

  it("la rúbrica es una checklist y la entrega depende de challengeReadiness", () => {
    expect(src).toContain("challengeReadiness");
    expect(src).toContain("Checkbox");
    expect(src).toContain("palabras");
  });

  it("ofrece la opinión de Emma vía el caso de uso y sobrevive si falla", () => {
    expect(src).toContain("reviewChallenge");
    expect(src).toContain("Pedir opinión a Emma");
    expect(src).toContain("no pudo revisar");
  });
});

describe("repaso SRS", () => {
  const src = source("srs-review.tsx");

  it("recuerdo activo: escribe y comprueba con checkRecall; muestra caja y próximo repaso", () => {
    expect(src).toContain("checkRecall");
    expect(src).toContain("isTypedRecall");
    expect(src).toContain("nextReviewInDays");
    expect(src).toContain("summarizeReview");
    expect(src).toContain("Comprobar");
  });
});
