import { describe, it, expect } from "vitest";
import { classifyError } from "../error-taxonomy";

describe("classifyError", () => {
  it("detecta capitalización", () => {
    expect(classifyError("i work here", "I work here")).toBe("capitalization");
  });
  it("detecta puntuación", () => {
    expect(classifyError("Hello world", "Hello, world")).toBe("punctuation");
  });
  it("detecta artículos", () => {
    expect(classifyError("I saw cat", "I saw a cat")).toBe("article");
  });
  it("detecta preposiciones", () => {
    expect(classifyError("I go to home in monday", "I go to home on monday")).toBe("preposition");
  });
  it("detecta forma de palabra", () => {
    expect(classifyError("he go", "he goes")).toBe("word_form");
  });
  it("cae en grammar cuando no encaja en otra categoría", () => {
    expect(classifyError("me want coffee", "I would like coffee")).toBe("grammar");
  });
});
