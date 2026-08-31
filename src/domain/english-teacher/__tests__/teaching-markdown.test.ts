import { describe, it, expect } from "vitest";
import { assembleTeaching } from "../teaching-markdown";
import type {
  GrammarStructure,
  PronunciationRow,
  ReplySuggestion,
} from "../teaching-models";

const empty = { phonetics: [], grammar: [], replies: [] };

describe("assembleTeaching", () => {
  it("devuelve cadena vacía cuando no hay ninguna sección con contenido", () => {
    expect(assembleTeaching(empty)).toBe("");
  });

  it("renderiza la tabla de pronunciación con encabezado y filas", () => {
    const phonetics: PronunciationRow[] = [
      { word: "hi", sounds: "jai", translation: "hola" },
    ];
    const md = assembleTeaching({ ...empty, phonetics });
    expect(md).toContain("### 🗣️ Pronunciation");
    expect(md).toContain("| Inglés | Pronunciación | Traducción |");
    expect(md).toContain("| --- | --- | --- |");
    expect(md).toContain("| hi | jai | hola |");
  });

  it("renderiza un punto gramatical con label, patrón, ejemplo y explicación", () => {
    const grammar: GrammarStructure[] = [
      {
        label: "Imperative",
        pattern: "verb + object",
        example: "Close it",
        explanation: "Órdenes.",
      },
    ];
    const md = assembleTeaching({ ...empty, grammar });
    expect(md).toContain("### 📐 Grammar");
    expect(md).toContain("**Imperative** — `verb + object`");
    expect(md).toContain("> Close it"); // el ejemplo va como cita
    expect(md).toContain("Órdenes.");
  });

  it("omite patrón, ejemplo y explicación vacíos del punto gramatical", () => {
    const grammar: GrammarStructure[] = [
      { label: "Solo", pattern: "", example: "", explanation: "" },
    ];
    const md = assembleTeaching({ ...empty, grammar });
    expect(md).toContain("**Solo**");
    expect(md).not.toContain("`"); // sin patrón no hay backticks
    expect(md).not.toContain(">"); // sin ejemplo no hay cita
  });

  it("filtra puntos gramaticales sin label", () => {
    const grammar: GrammarStructure[] = [
      { label: "", pattern: "x", example: "", explanation: "" },
    ];
    // sin label el punto se filtra → la sección Grammar queda vacía → no se emite
    expect(assembleTeaching({ ...empty, grammar })).toBe("");
  });

  it("renderiza sugerencias de respuesta con y sin nota", () => {
    const replies: ReplySuggestion[] = [
      { english: "Hi", note: "casual" },
      { english: "Hello", note: "" },
    ];
    const md = assembleTeaching({ ...empty, replies });
    expect(md).toContain("### 💡 Reply suggestions");
    expect(md).toContain("- **Hi** — casual");
    expect(md).toContain("- **Hello**");
    expect(md).not.toContain("- **Hello** —");
  });

  it("mantiene el orden Pronunciation → Grammar → Reply suggestions", () => {
    const md = assembleTeaching({
      phonetics: [{ word: "hi", sounds: "jai", translation: "hola" }],
      grammar: [{ label: "L", pattern: "", example: "", explanation: "" }],
      replies: [{ english: "Hi", note: "" }],
    });
    const idxPron = md.indexOf("Pronunciation");
    const idxGram = md.indexOf("Grammar");
    const idxReply = md.indexOf("Reply suggestions");
    expect(idxPron).toBeLessThan(idxGram);
    expect(idxGram).toBeLessThan(idxReply);
  });

  it("omite las secciones vacías dejando solo las que tienen contenido", () => {
    const md = assembleTeaching({ ...empty, replies: [{ english: "Hi", note: "" }] });
    expect(md).toContain("Reply suggestions");
    expect(md).not.toContain("Pronunciation");
    expect(md).not.toContain("Grammar");
  });
});
