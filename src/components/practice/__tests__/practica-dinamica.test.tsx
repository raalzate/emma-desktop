/**
 * Prácticas dinámicas: la UI de ejercicios, retos, repaso y el panel «Hoy»
 * pintan lo que el dominio decide (progreso, pista, rúbrica, recuerdo
 * activo, plan del día), en inglés y con los tokens del rediseño.
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
    expect(html).toContain("Today");
    expect(html).toContain(plan.headlineEs);
    expect(html.indexOf("Spaced review")).toBeLessThan(html.indexOf("Unit 3 exercises"));
    expect(html).toContain("Challenge 2");
    expect(html).toContain(">4<");
    expect((html.match(/<button/g) ?? []).length).toBe(plan.steps.length);
  });

  it("numera los pasos como «Step N» para que el número no se lea como cantidad", () => {
    const plan = buildPracticeToday({ dueCards: 0, challenges: { done: 0, total: 72 }, nextChallengeId: null, activeUnit: null });
    const html = renderToStaticMarkup(createElement(PracticeToday, { plan, onPick: () => undefined }));
    expect(html).toContain("Step 1");
    expect(html).toContain("Step 2");
    expect(html).not.toMatch(/>2<\/span>Exercises/);
  });

  it("sin plan muestra un placeholder, no un panel vacío", () => {
    const html = renderToStaticMarkup(createElement(PracticeToday, { plan: null, onPick: () => undefined }));
    expect(html).toContain("animate-pulse");
    expect(html).not.toContain("Today");
  });
});

describe("ejercicios (drill)", () => {
  const runtime = { repos: { srs: { loadCards: async () => [], saveCards: async () => undefined } } } as unknown as EmmaRuntime;

  it("abre un ejercicio por deep-link mostrando el stem, el progreso y la pista disponible", () => {
    const html = renderToStaticMarkup(
      createElement(ExerciseDrill, { runtime, initialUnit: 14, initialExerciseId: "14A" }),
    );
    expect(html).toContain("14A");
    expect(html).toContain("Item 1 of 7");
    expect(html).toContain("By the time he ____ (be) paged");
    expect(html).toContain("Hint");
    expect(html).toContain("Check");
    expect(html).toContain("Type the answer in English");
    // La clave nunca se muestra antes de intentar.
    expect(html).not.toContain("had already reached");
  });

  it("clasificar la -ed se responde tocando una opción, no escribiendo /t/", () => {
    const html = renderToStaticMarkup(
      createElement(ExerciseDrill, { runtime, initialUnit: 0, initialExerciseId: "P1.5" }),
    );
    expect(html).toContain("shipped");
    expect(html).toContain("Tap the right option");
    for (const option of ["/t/", "/d/", "/ɪd/"]) expect(html).toContain(`>${option}<`);
    // Sin campo de texto ni botón Check: la opción corrige al tocarla.
    expect(html).not.toContain("Your answer in English");
    expect(html).not.toContain(">Check<");
    // Se puede escuchar la palabra: escuchar es parte del ejercicio de sonidos.
    expect(html).toContain("Listen");
  });

  it("la sílaba fuerte ofrece la misma palabra con cada sílaba en mayúsculas", () => {
    const html = renderToStaticMarkup(
      createElement(ExerciseDrill, { runtime, initialUnit: 0, initialExerciseId: "P1.7" }),
    );
    expect(html).toContain(">DEployment<");
    expect(html).toContain(">dePLOYment<");
    expect(html).toContain(">deployMENT<");
  });

  it("la lista dice cuántos ejercicios hay en la unidad", () => {
    const html = renderToStaticMarkup(createElement(ExerciseDrill, { runtime, initialUnit: 0 }));
    expect(html).toContain("3 exercises in this unit");
  });

  it("sin deep-link lista los ejercicios de la unidad con su tipo", () => {
    const html = renderToStaticMarkup(createElement(ExerciseDrill, { runtime, initialUnit: 14 }));
    expect(html).toContain("Fill in");
    expect(html).toContain("items");
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
    expect(src).toContain("words");
  });

  it("ofrece la opinión de Emma vía el caso de uso y sobrevive si falla", () => {
    expect(src).toContain("reviewChallenge");
    expect(src).toContain("Ask Emma");
    expect(src).toContain("couldn't review");
  });

  it("explica cada modo (qué es «en voz alta») y qué hacen los checks; Emma los marca al opinar", () => {
    expect(src).toContain("MODE_HELP_ES[challenge.mode]");
    expect(src).toMatch(/oral:\s*\n?\s*"Spoken challenge/);
    expect(src).toContain("all must be checked to submit");
    expect(src).toContain("result.criteriaMet.flatMap");
  });
});

describe("repaso SRS", () => {
  const src = source("srs-review.tsx");

  it("recuerdo activo: escribe y comprueba con checkRecall; muestra caja y próximo repaso", () => {
    expect(src).toContain("checkRecall");
    expect(src).toContain("isTypedRecall");
    expect(src).toContain("nextReviewInDays");
    expect(src).toContain("summarizeReview");
    expect(src).toContain("Check");
  });

  it("andamiaje del dominio: la frase con huecos es la consigna, la pista da primeras letras y se corrige palabra a palabra", () => {
    expect(src).toContain("recallPromptEs(current.kind, current)");
    expect(src).toContain("recallHint(current)");
    expect(src).toContain("wordDiff(expected, given)");
    expect(src).toContain("Hint");
    expect(src).toContain("recallFront(current)");
    // Contexto de lo que dijo el aprendiz junto a la frase con huecos.
    expect(src).toContain("recallContext(current)");
    expect(src).toContain("You said:");
    // Se acepta escribir sólo las palabras que faltan.
    expect(src).toContain("recallTarget(current, typed)");
    expect(src).toContain("Type the missing words");
    // Las tarjetas que nacieron de una reformulación no se repasan.
    expect(src).toContain("due.filter(isTeachableCard)");
  });
});

describe("laboratorio de sonidos", () => {
  const src = source("minimal-pair-lab.tsx");

  it("el botón de escuchar es visible con texto y se recrea por ítem (sin audio cacheado del anterior)", () => {
    expect(src).toContain('label="Listen to the word"');
    expect(src).toMatch(/<SpeakButton key=\{`speak-\$\{index\}/);
  });

  it("guía la ronda en pasos: escuchar, elegir, pronunciar", () => {
    expect(src).toContain("1 · Listen to the word");
    expect(src).toContain("2 · Which of the two did you hear?");
    expect(src).toContain("3 · Now say it yourself");
  });

  it("el reto de shadowing se graba oración por oración, con pasos y aviso cuando no se oyó nada", () => {
    expect(src).toContain("splitSentences(text)");
    expect(src).toContain("Record this sentence");
    expect(src).toContain("heardNothing(result)");
    expect(src).toContain("Nothing was recognized.");
    expect(src).toContain("1. Listen to each sentence twice.");
    expect(src).not.toContain("Say the whole text");
  });
});

describe("análisis enriquecido tras responder (Explain with Emma)", () => {
  it("el panel de feedback ofrece la explicación: palabra, pronunciación, traducción, porqué y ejemplo", () => {
    const src = source("exercise-drill.tsx");
    expect(src).toContain("explainExerciseItem({");
    expect(src).toContain("Explain with Emma");
    expect(src).toContain("<FeedbackPanel state={state} runtime={runtime} />");
    expect(src).toContain("explanation.translationEs");
    expect(src).toContain("explanation.whyEs");
    expect(src).toContain("explanation.exampleEn");
    expect(src).toContain("Emma couldn't explain this time.");
  });
});

describe("las lecciones se cierran solas al hacer la actividad", () => {
  it("terminar el repaso cierra «Review your cards»; entregar el reto cierra «Unit N challenge»", () => {
    expect(source("srs-review.tsx")).toContain('completeByKind("srs-review")');
    expect(source("challenge-view.tsx")).toContain('completeByKind("challenge", `unit-${unit}`)');
  });
  it("la lista muestra título y motivo en inglés aunque el store los tenga en español", () => {
    const list = fs.readFileSync(path.join(process.cwd(), "src/components/lessons/lesson-todo-list.tsx"), "utf8");
    expect(list).toContain("lessonTodoTitle(todo)");
    expect(list).toContain("lessonTodoReason(todo)");
    expect(list).not.toContain("{todo.titleEs}");
    expect(list).not.toContain("{todo.reasonEs}");
  });
});

describe("plan de estudio", () => {
  it("es personal: semana actual, tareas de la semana en la app y estado por semana", async () => {
    const { StudyPlanView } = await import("@/components/practice/study-plan-view");
    const html = renderToStaticMarkup(
      createElement(StudyPlanView, { activeUnit: 3, completedChallengeIds: [] }),
    );
    expect(html).toContain("Week 5 of 24");
    expect(html).toContain("Unit 3 · ");
    expect(html).toContain("Unit 3 lesson");
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("What to study");
    expect(html).toContain("this week");
    expect(html).toContain("done");
  });

  it("sin unidad activa arranca en la semana 1 de sonidos", async () => {
    const { StudyPlanView } = await import("@/components/practice/study-plan-view");
    const html = renderToStaticMarkup(
      createElement(StudyPlanView, { activeUnit: null, completedChallengeIds: [] }),
    );
    expect(html).toContain("Week 1 of 24");
    expect(html).toContain("Sounds");
  });

  it("ninguna pantalla de Práctica habla del «libro» ni de sus capítulos al usuario", () => {
    for (const file of fs.readdirSync(PRACTICE_DIR).filter((f) => f.endsWith(".tsx"))) {
      // Sólo texto visible: se quitan comentarios de bloque y de línea.
      const visible = source(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(visible, file).not.toMatch(/libro|Parte \d|§/);
    }
  });
});

// H6 (#199): las seis secciones dejaron de ser pestañas y son rutas propias;
// /practice sólo muestra «Mis lecciones» (por defecto) y «Hoy».
describe("/practice: dos pestañas, Mis lecciones primero", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "src/app/practice/page.tsx"), "utf8");

  it("«My lessons» es la pestaña por defecto, antes que «Today»", () => {
    expect(page).toContain('defaultValue="lessons"');
    expect(page.indexOf('value="lessons"')).toBeLessThan(page.indexOf('value="today"'));
    expect(page).toContain("What Emma left you to practice");
  });

  it("«Today» sigue mostrando el panel del plan con el mismo componente", () => {
    expect(page).toContain("<PracticeToday");
    expect(page).toContain('value="today"');
  });

  it("ya no arma las seis pestañas de ejercicios/repaso/etc.: eso vive en las subrutas", () => {
    expect(page).not.toContain('value="exercises"');
    expect(page).not.toContain('value="srs"');
    expect(page).not.toContain("<ExerciseDrill");
    expect(page).not.toContain("<ChallengeView");
  });

  it("un enlace viejo ?tab= redirige a la subruta nueva conservando los parámetros", () => {
    expect(page).toContain("legacyPracticeRedirect");
    expect(page).toMatch(/router\.replace\(target\)/);
  });

  it("elegir un paso del plan «Hoy» navega a la subruta de esa pestaña", () => {
    expect(page).toContain("practiceHrefFor(step.tab");
    expect(page).toMatch(/router\.push\(/);
  });
});

describe("subrutas de Práctica (H6, #199)", () => {
  const CASES: Array<{ file: string; component: string; params: string[] }> = [
    { file: "src/app/practice/exercises/page.tsx", component: "ExerciseDrill", params: ["unit", "exercise"] },
    { file: "src/app/practice/review/page.tsx", component: "SrsReview", params: [] },
    { file: "src/app/practice/pronunciation/page.tsx", component: "MinimalPairLab", params: ["contrast"] },
    { file: "src/app/practice/plan/page.tsx", component: "StudyPlanView", params: [] },
    { file: "src/app/practice/self-check/page.tsx", component: "SelfAssessmentView", params: ["level"] },
    { file: "src/app/practice/challenges/page.tsx", component: "ChallengeView", params: ["unit"] },
  ];

  it.each(CASES)("$file existe, pinta $component y lee sus parámetros de la URL en Suspense", ({ file, component, params }) => {
    const src = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    expect(src).toContain("use client");
    expect(src).toContain(`<${component}`);
    expect(src).toContain("Suspense");
    expect(src).toContain("useSearchParams");
    for (const param of params) {
      expect(src).toContain(`"${param}"`);
    }
  });
});

describe("motor de voz compartido", () => {
  it("useKaraoke descarta el audio cacheado cuando cambia el texto", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/components/chat/use-karaoke.ts"), "utf8");
    expect(src).toMatch(/audioRef\.current = null;[\s\S]*\[script\.speakText, gender, voiceId\]/);
  });
});
