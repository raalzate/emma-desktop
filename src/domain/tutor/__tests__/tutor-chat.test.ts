/**
 * Chat de apoyo con EMMA en la práctica (#357, T8): pedirle que traduzca o
 * explique algo. Es andamiaje (como «Help in Spanish»), no la conversación de
 * práctica: responde en el idioma de la pregunta y los ejemplos van en inglés.
 */
import { describe, expect, it } from "vitest";
import { buildTutorPrompt, validTutorQuestion, TUTOR_SYSTEM } from "../tutor-chat";

describe("validTutorQuestion (borde)", () => {
  it("recorta y acepta una pregunta normal", () => {
    expect(validTutorQuestion("  ¿Cómo se dice despliegue?  ")).toBe("¿Cómo se dice despliegue?");
  });
  it("rechaza vacío o demasiado largo", () => {
    expect(validTutorQuestion("   ")).toBeNull();
    expect(validTutorQuestion("x".repeat(801))).toBeNull();
  });
});

describe("buildTutorPrompt", () => {
  it("incluye el nivel, las últimas vueltas y la pregunta nueva", () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 ? "assistant" : "user") as "user" | "assistant",
      content: `turn ${i}`,
    }));
    const p = buildTutorPrompt({ question: "Translate: deploy", level: "A2", history });
    expect(p).toContain("Learner level: A2");
    expect(p).toContain("turn 9");
    expect(p).not.toContain("turn 3");
    expect(p).toContain("Translate: deploy");
  });

  it("el system pide responder en el idioma de la pregunta, breve y con ejemplos en inglés", () => {
    expect(TUTOR_SYSTEM).toMatch(/same language/i);
    expect(TUTOR_SYSTEM).toMatch(/examples in English/i);
    expect(TUTOR_SYSTEM).toMatch(/short/i);
  });
});
