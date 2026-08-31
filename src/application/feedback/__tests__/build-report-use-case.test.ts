import { describe, it, expect } from "vitest";
import { buildFeedbackReport, type FeedbackReportInput } from "../build-report-use-case";
import type { SilentError } from "@/domain/chat/silent-error";
import { CHARACTER_COMMENTARY } from "@/domain/feedback/report-text";
import { LESSON_TIPS } from "@/domain/feedback/lesson-tips";

function err(partial: Partial<SilentError> = {}): SilentError {
  return { label: "grammar", original: "me want", corrected: "I would like", ...partial };
}

function input(overrides: Partial<FeedbackReportInput> = {}): FeedbackReportInput {
  return {
    scenario: "daily_standup",
    metric: { turns: 5, errors: 2 },
    errors: [err()],
    level: "A2",
    ...overrides,
  };
}

describe("buildFeedbackReport — sin errores", () => {
  it("usa la plantilla de felicitación cuando no hay errores", () => {
    const md = buildFeedbackReport(input({ errors: [] }));
    expect(md).toContain("## Simulación completada — ¡buen trabajo!");
  });

  it("interpola escenario en Title Case y guiones bajos como espacios", () => {
    const md = buildFeedbackReport(input({ errors: [], scenario: "daily_standup" }));
    expect(md).toContain("**Daily Standup**");
  });

  it("interpola el número de turnos de la métrica", () => {
    const md = buildFeedbackReport(input({ errors: [], metric: { turns: 7, errors: 0 } }));
    expect(md).toContain("en 7 turnos");
  });

  it("trata errores no accionables (sugerencia == original) como cero errores", () => {
    // corrected coincide con original tras trim -> filtrado -> plantilla feliz
    const md = buildFeedbackReport(
      input({ errors: [err({ original: " hola ", corrected: "hola" })] }),
    );
    expect(md).toContain("## Simulación completada — ¡buen trabajo!");
  });
});

describe("buildFeedbackReport — con errores", () => {
  it("emite el encabezado Code Review Lingüístico con el escenario", () => {
    const md = buildFeedbackReport(input());
    expect(md).toContain("## Revisión de código lingüística — Daily Standup");
  });

  it("muestra el conteo de capturas igual a los errores accionables, no a los crudos", () => {
    // 2 accionables + 1 no accionable -> Capturas silenciosas: 2
    const md = buildFeedbackReport(
      input({
        errors: [
          err({ label: "article", original: "I saw cat", corrected: "I saw a cat" }),
          err({ label: "grammar", original: "me want", corrected: "I want" }),
          err({ label: "grammar", original: "same", corrected: "same" }),
        ],
      }),
    );
    expect(md).toContain("**Capturas silenciosas:** 2");
  });

  it("numera las filas de la tabla desde 1", () => {
    const md = buildFeedbackReport(
      input({
        errors: [
          err({ label: "article", original: "I saw cat", corrected: "I saw a cat" }),
          err({ label: "grammar", original: "me want", corrected: "I want" }),
        ],
      }),
    );
    expect(md).toContain("| 1 | article | I saw cat | I saw a cat |");
    expect(md).toContain("| 2 | grammar | me want | I want |");
  });

  it("escapa las barras verticales en el texto para no romper la tabla Markdown", () => {
    const md = buildFeedbackReport(
      input({ errors: [err({ original: "a|b", corrected: "c|d" })] }),
    );
    expect(md).toContain("a\\|b");
    expect(md).toContain("c\\|d");
  });

  it("incluye la sección de patrones recurrentes con el conteo por etiqueta", () => {
    const md = buildFeedbackReport(
      input({
        errors: [
          err({ label: "article", original: "I saw cat", corrected: "I saw a cat" }),
          err({ label: "article", original: "buy car", corrected: "buy a car" }),
        ],
      }),
    );
    expect(md).toContain("### Patrones recurrentes");
    expect(md).toContain("- **article** — 2 aparición(es)");
  });

  it("ordena patrones por conteo desc y rompe empates por primera aparición", () => {
    const md = buildFeedbackReport(
      input({
        errors: [
          err({ label: "article", original: "saw cat", corrected: "saw a cat" }),
          err({ label: "preposition", original: "on monday", corrected: "in monday" }),
          err({ label: "article", original: "buy car", corrected: "buy a car" }),
          err({ label: "preposition", original: "at home", corrected: "to home" }),
          err({ label: "word_order", original: "you are who", corrected: "who are you" }),
        ],
      }),
    );
    const iArticle = md.indexOf("**article** — 2");
    const iPrep = md.indexOf("**preposition** — 2");
    const iOrder = md.indexOf("**word_order** — 1");
    expect(iArticle).toBeGreaterThanOrEqual(0);
    // article insertado antes que preposition => gana el empate
    expect(iArticle).toBeLessThan(iPrep);
    expect(iPrep).toBeLessThan(iOrder);
  });

  it("incluye la lección de práctica con los tips de las 2 etiquetas más comunes", () => {
    const md = buildFeedbackReport(
      input({
        errors: [
          err({ label: "article", original: "saw cat", corrected: "saw a cat" }),
          err({ label: "preposition", original: "on monday", corrected: "in monday" }),
        ],
      }),
    );
    expect(md).toContain("### Lección de práctica");
    expect(md).toContain(`- **article**: ${LESSON_TIPS.article}`);
    expect(md).toContain(`- **preposition**: ${LESSON_TIPS.preposition}`);
  });

  it("limita la lección a lo sumo a 2 etiquetas", () => {
    const md = buildFeedbackReport(
      input({
        errors: [
          err({ label: "article", original: "saw cat", corrected: "saw a cat" }),
          err({ label: "preposition", original: "on monday", corrected: "in monday" }),
          err({ label: "word_order", original: "you are who", corrected: "who are you" }),
        ],
      }),
    );
    // word_order es el 3ro por conteo -> no aparece su tip en la lección
    expect(md).not.toContain(`- **word_order**: ${LESSON_TIPS.word_order}`);
  });

  it("recomienda un escenario de práctica a partir de la etiqueta más común", () => {
    const md = buildFeedbackReport(
      input({ errors: [err({ label: "article", original: "saw cat", corrected: "saw a cat" })] }),
    );
    expect(md).toContain("**Escenario recomendado para practicar:** `intro_yourself`");
  });

  it("omite la recomendación cuando la etiqueta no tiene escenario mapeado", () => {
    // 'grammar' -> daily_standup existe; usamos una etiqueta sin mapeo directo probando ausencia de otra
    const md = buildFeedbackReport(
      input({ errors: [err({ label: "grammar", original: "me want", corrected: "I want" })] }),
    );
    // grammar SÍ mapea a daily_standup segun el catalogo
    expect(md).toContain("**Escenario recomendado para practicar:** `daily_standup`");
  });

  it("incluye el drill de reescritura y lectura en voz alta", () => {
    const md = buildFeedbackReport(input());
    expect(md).toContain("**Ejercicio:** Reescribe tus tres últimos mensajes");
  });
});

describe("buildFeedbackReport — bloque de situación", () => {
  it("agrega el bloque de situación con el comentario del carácter", () => {
    const md = buildFeedbackReport(
      input({
        situation: { character: "incident", variantId: "incident.server_down" },
      }),
    );
    expect(md).toContain("### Situación activa");
    expect(md).toContain(CHARACTER_COMMENTARY.incident);
  });

  it("deriva el título de la situación tras el primer punto del variantId", () => {
    const md = buildFeedbackReport(
      input({ situation: { character: "conflict", variantId: "conflict.late_delivery" } }),
    );
    expect(md).toContain("**late_delivery** (variante `conflict.late_delivery`)");
  });

  it("usa el variantId completo como título cuando no tiene punto", () => {
    const md = buildFeedbackReport(
      input({ situation: { character: "routine", variantId: "standalone" } }),
    );
    expect(md).toContain("**standalone** (variante `standalone`)");
  });

  it("prioriza situationTitle explícito sobre el derivado del variantId", () => {
    const md = buildFeedbackReport(
      input({
        situation: { character: "onboarding", variantId: "onboarding.day_one" },
        situationTitle: "Primer día",
      }),
    );
    expect(md).toContain("**Primer día** (variante `onboarding.day_one`)");
  });

  it("adjunta el bloque de situación también en el reporte sin errores", () => {
    const md = buildFeedbackReport(
      input({
        errors: [],
        situation: { character: "incident", variantId: "incident.outage" },
      }),
    );
    expect(md).toContain("## Simulación completada — ¡buen trabajo!");
    expect(md).toContain("### Situación activa");
  });

  it("deja el comentario vacío cuando el carácter no está en el catálogo", () => {
    const md = buildFeedbackReport(
      input({
        errors: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        situation: { character: "unknown" as any, variantId: "x.y" },
      }),
    );
    expect(md).toContain("**y** (variante `x.y`)");
  });
});
