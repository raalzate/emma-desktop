import { describe, it, expect } from "vitest";
import { SummarizeDiagnosisUseCase, type NotesFor } from "../summarize-diagnosis-use-case";

describe("summarize-diagnosis-use-case", () => {
  it("agrega las notas devueltas por el puerto (async)", async () => {
    const notesFor: NotesFor = async (userId) => {
      expect(userId).toBe("u1");
      return ["tense_error", "tense_error", "article_misuse"];
    };
    const res = await new SummarizeDiagnosisUseCase(notesFor).execute("u1");
    expect(res.totalIssues).toBe(3);
    expect(res.categories[0]).toEqual({ category: "tense_error", count: 2 });
  });

  it("admite un puerto síncrono que devuelve el array directamente", async () => {
    const notesFor: NotesFor = () => ["a", "a", "b"];
    const res = await new SummarizeDiagnosisUseCase(notesFor).execute("u2");
    expect(res.categories[0]).toEqual({ category: "a", count: 2 });
  });

  it("devuelve un resumen vacío cuando no hay notas", async () => {
    const res = await new SummarizeDiagnosisUseCase(async () => []).execute("u3");
    expect(res).toEqual({ categories: [], totalIssues: 0 });
  });
});
