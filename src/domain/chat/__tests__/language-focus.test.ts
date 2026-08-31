import { describe, expect, it } from "vitest";

import { buildLanguageFocus, buildTutorAwareness } from "../language-focus";
import type { CurriculumUnit } from "@/domain/curriculum/unit";

const unit: CurriculumUnit = {
  number: 4,
  title: "Daily standup basics",
  cefrLevel: "A1",
  scenarioEs: "escena",
  goalEs: "meta",
  grammarFocus: [],
  soundFocus: "",
  chunks: [
    { text: "No blockers.", functionEs: "cerrar sin bloqueos" },
    { text: "I'm blocked on X.", functionEs: "reportar bloqueo" },
    { text: "That's me.", functionEs: "cerrar turno" },
    { text: "I picked up X.", functionEs: "decir qué tomaste" },
    { text: "Today I'm carrying on with…", functionEs: "continuar tarea" },
    { text: "I should have a PR up by…", functionEs: "estimar entrega" },
    { text: "I'll need access to Y.", functionEs: "pedir acceso" },
  ],
  traps: [
    { wrong: "Is broken.", right: "It's broken.", noteEs: "sujeto omitido" },
    { wrong: "I'm developer.", right: "I'm a developer.", noteEs: "sin artículo" },
    { wrong: "I have 30 years.", right: "I am 30.", noteEs: "have vs be" },
    { wrong: "Depends of X.", right: "It depends on X.", noteEs: "preposición" },
    { wrong: "I am agree.", right: "I agree.", noteEs: "verbo redundante" },
  ],
  challenges: [],
  scenarioTypes: ["daily_standup"],
};

describe("buildLanguageFocus", () => {
  it("incluye el encabezado con número y título de la unidad", () => {
    const focus = buildLanguageFocus(unit);
    expect(focus).toMatch(/LANGUAGE FOCUS \(Unit 4: Daily standup basics\)/);
  });

  it("lista hasta 6 chunks (el texto EN, sin la función en español)", () => {
    const focus = buildLanguageFocus(unit);
    expect(focus).toContain("No blockers.");
    expect(focus).toContain("I should have a PR up by…");
    expect(focus).not.toContain("I'll need access to Y.");
    expect(focus).not.toMatch(/cerrar sin bloqueos/);
  });

  it("instruye crear oportunidades naturales para usar los chunks", () => {
    const focus = buildLanguageFocus(unit);
    expect(focus).toMatch(/natural opportunit/i);
  });

  it("lista hasta 4 trampas wrong -> right y pide vigilarlas sin corregir en la conversación", () => {
    const focus = buildLanguageFocus(unit);
    expect(focus).toContain("Is broken.");
    expect(focus).toContain("It's broken.");
    expect(focus).not.toContain("I am agree.");
    expect(focus).toMatch(/watch for|monitor/i);
    expect(focus).toMatch(/never correct|silent/i);
  });

  it("respeta maxChunks y maxTraps si se pasan explícitos", () => {
    const focus = buildLanguageFocus(unit, { maxChunks: 2, maxTraps: 1 });
    expect(focus).toContain("No blockers.");
    expect(focus).toContain("I'm blocked on X.");
    expect(focus).not.toContain("That's me.");
    expect(focus).toContain("Is broken.");
    expect(focus).not.toContain("I'm developer.");
  });

  it("es determinista: siempre toma los primeros N, sin aleatoriedad", () => {
    const a = buildLanguageFocus(unit);
    const b = buildLanguageFocus(unit);
    expect(a).toBe(b);
  });
});

describe("buildTutorAwareness", () => {
  it("devuelve cadena vacía si no hay categorías débiles", () => {
    expect(buildTutorAwareness([])).toBe("");
  });

  it("incluye el encabezado y las categorías débiles en inglés", () => {
    const block = buildTutorAwareness(["article", "preposition"]);
    expect(block).toMatch(/TUTOR AWARENESS/);
    expect(block).toContain("article");
    expect(block).toContain("preposition");
  });

  it("instruye crear oportunidades sin corregir explícitamente ni salir del personaje", () => {
    const block = buildTutorAwareness(["word_order"]);
    expect(block).toMatch(/create opportunit/i);
    expect(block).toMatch(/without.*(explicit correction|breaking character)/i);
  });

  it("es compacto: 2 a 3 líneas", () => {
    const block = buildTutorAwareness(["grammar"]);
    const lines = block.split("\n").filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.length).toBeLessThanOrEqual(3);
  });
});
