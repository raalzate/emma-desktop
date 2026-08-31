import { describe, it, expect } from "vitest";
import {
  resolveLanguageName,
  grammarPrompt,
  phoneticsPrompt,
  repliesPrompt,
} from "../teaching-prompt";
import {
  GRAMMAR_SYSTEM,
  PHONETICS_SYSTEM,
  repliesSystem,
} from "../teaching-prompt-text";
import type { TeachingRequest } from "../teaching-models";

const baseRequest = (over: Partial<TeachingRequest> = {}): TeachingRequest => ({
  text: "Close the door please.",
  responseId: "r1",
  userId: 1,
  explainLanguage: "es",
  contextHistory: [],
  ...over,
});

describe("resolveLanguageName", () => {
  it("resuelve los códigos conocidos a su nombre en inglés", () => {
    expect(resolveLanguageName("es")).toBe("Spanish");
    expect(resolveLanguageName("fr")).toBe("French");
    expect(resolveLanguageName("zh")).toBe("Mandarin Chinese");
  });

  it("cae a 'English' para un código desconocido", () => {
    expect(resolveLanguageName("xx")).toBe("English");
  });
});

describe("grammarPrompt", () => {
  it("usa el system de gramática y antepone 'Text:' al texto", () => {
    const pair = grammarPrompt("Do it now");
    expect(pair.system).toBe(GRAMMAR_SYSTEM);
    expect(pair.user).toBe("Text:\nDo it now");
  });
});

describe("phoneticsPrompt", () => {
  it("usa el system de fonética y une las frases con saltos de línea", () => {
    const pair = phoneticsPrompt(["hello", "world"]);
    expect(pair.system).toBe(PHONETICS_SYSTEM);
    expect(pair.user).toBe("Frases:\nhello\nworld");
  });
});

describe("repliesPrompt", () => {
  it("incluye el nombre del idioma en el system de respuestas", () => {
    const pair = repliesPrompt(baseRequest(), "Spanish");
    expect(pair.system).toBe(repliesSystem("Spanish"));
    expect(pair.system).toContain("Spanish");
  });

  it("incluye el texto de Emma y '(no prior turns)' sin historial", () => {
    const pair = repliesPrompt(baseRequest(), "Spanish");
    expect(pair.user).toContain("Emma said:\nClose the door please.");
    expect(pair.user).toContain("(no prior turns)");
  });

  it("formatea el historial mapeando roles a etiquetas legibles", () => {
    const pair = repliesPrompt(
      baseRequest({
        contextHistory: [
          { role: "user", content: "hi" },
          { role: "assistant", content: "hello" },
        ],
      }),
      "Spanish",
    );
    expect(pair.user).toContain("Learner: hi");
    expect(pair.user).toContain("Emma: hello");
  });

  it("omite los turnos con contenido vacío", () => {
    const pair = repliesPrompt(
      baseRequest({
        contextHistory: [
          { role: "user", content: "   " },
          { role: "assistant", content: "hola" },
        ],
      }),
      "Spanish",
    );
    expect(pair.user).not.toContain("Learner:");
    expect(pair.user).toContain("Emma: hola");
  });

  it("usa el rol crudo cuando no hay etiqueta conocida", () => {
    const pair = repliesPrompt(
      baseRequest({ contextHistory: [{ role: "system", content: "nota" }] }),
      "Spanish",
    );
    expect(pair.user).toContain("system: nota");
  });
});
