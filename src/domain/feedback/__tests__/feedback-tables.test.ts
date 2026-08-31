import { describe, it, expect } from "vitest";
import { CHARACTER_COMMENTARY, SituationCharacter } from "../report-text";
import { LESSON_TIPS } from "../lesson-tips";
import type { ErrorLabel } from "@/domain/chat/error-taxonomy";

const ALL_LABELS: ErrorLabel[] = [
  "article",
  "preposition",
  "word_form",
  "word_order",
  "punctuation",
  "capitalization",
  "spacing",
  "grammar",
];

describe("LESSON_TIPS", () => {
  it("tiene un tip para cada etiqueta de la taxonomía de errores", () => {
    for (const label of ALL_LABELS) {
      expect(LESSON_TIPS[label]).toBeTruthy();
    }
  });

  it("expone exactamente las etiquetas de la taxonomía, sin claves extra", () => {
    expect(Object.keys(LESSON_TIPS).sort()).toEqual([...ALL_LABELS].sort());
  });
});

describe("CHARACTER_COMMENTARY", () => {
  it("tiene un comentario para cada carácter de situación", () => {
    for (const character of Object.values(SituationCharacter)) {
      expect(CHARACTER_COMMENTARY[character]).toBeTruthy();
    }
  });

  it("expone exactamente los cuatro caracteres definidos", () => {
    expect(Object.keys(CHARACTER_COMMENTARY).sort()).toEqual(
      ["conflict", "incident", "onboarding", "routine"].sort(),
    );
  });
});
