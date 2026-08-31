import { describe, it, expect } from "vitest";
import {
  LEVEL_HINTS,
  buildSuggestRepliesPrompt,
  buildCompletePartialReplyPrompt,
  SUGGEST_REPLIES_SYSTEM_PROMPT,
  SUGGEST_REPLIES_WITH_DRAFT_APPENDIX,
  COMPLETE_PARTIAL_REPLY_SYSTEM_PROMPT,
} from "../reply-suggestion";

describe("LEVEL_HINTS", () => {
  it("mantiene el orden fijo easy -> mid -> advanced", () => {
    expect(LEVEL_HINTS).toEqual(["easy", "mid", "advanced"]);
  });
});

describe("buildSuggestRepliesPrompt", () => {
  it("antepone la línea CEFR seguida del contexto", () => {
    expect(buildSuggestRepliesPrompt("último turno de EMMA", "B2")).toBe(
      "CEFR: B2\núltimo turno de EMMA",
    );
  });

  it("usa B1 como nivel por defecto cuando el nivel es vacío", () => {
    expect(buildSuggestRepliesPrompt("ctx", "")).toBe("CEFR: B1\nctx");
  });

  it("sin draft no agrega ninguna sección extra (comportamiento idéntico)", () => {
    expect(buildSuggestRepliesPrompt("ctx", "B2")).toBe("CEFR: B2\nctx");
  });

  it("con draft agrega la sección del borrador del aprendiz e instrucción de alinear intención", () => {
    const out = buildSuggestRepliesPrompt("ctx", "B2", "I think we should");
    expect(out).toContain("CEFR: B2\nctx");
    expect(out).toContain('Learner\'s current draft: "I think we should"');
    expect(out.toLowerCase()).toContain("intent");
  });

  it("draft vacío o solo espacios se trata como sin draft", () => {
    expect(buildSuggestRepliesPrompt("ctx", "B2", "")).toBe("CEFR: B2\nctx");
    expect(buildSuggestRepliesPrompt("ctx", "B2", "   ")).toBe("CEFR: B2\nctx");
  });
});

describe("buildCompletePartialReplyPrompt", () => {
  it("concatena contexto y el texto que va tecleando el aprendiz", () => {
    expect(buildCompletePartialReplyPrompt("contexto", "I would like")).toBe(
      "contexto\nLearner is typing: I would like",
    );
  });

  it("conserva el parcial aun cuando esté vacío", () => {
    expect(buildCompletePartialReplyPrompt("ctx", "")).toBe("ctx\nLearner is typing: ");
  });
});

describe("system prompts (verbatim del original)", () => {
  it("el prompt de sugerencias pide exactamente 3 continuaciones en JSON", () => {
    expect(SUGGEST_REPLIES_SYSTEM_PROMPT).toContain("exactly 3 short reply continuations");
    expect(SUGGEST_REPLIES_SYSTEM_PROMPT).toContain("JSON array of 3 strings");
  });

  it("el prompt del completador pide hasta 3 frases completas en JSON", () => {
    expect(COMPLETE_PARTIAL_REPLY_SYSTEM_PROMPT).toContain("up to 3 natural full-sentence completions");
    expect(COMPLETE_PARTIAL_REPLY_SYSTEM_PROMPT).toContain("JSON array of strings");
  });

  it("el apéndice de draft explica que las sugerencias deben respetar la intención del borrador", () => {
    expect(SUGGEST_REPLIES_WITH_DRAFT_APPENDIX.toLowerCase()).toContain("draft");
    expect(SUGGEST_REPLIES_WITH_DRAFT_APPENDIX.toLowerCase()).toContain("intent");
  });
});
