import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CurrentLevelHeader } from "@/components/progress/current-level-header";

describe("CurrentLevelHeader — niveles propios (FR-006)", () => {
  const html = renderToStaticMarkup(createElement(CurrentLevelHeader, { level: "B1" }));

  it("el badge muestra «Level 3» y el texto habla de Level 1 a Level 5", () => {
    expect(html).toContain("Level 3");
    expect(html).toContain("Your journey from Level 1 to Level 5");
  });

  it("no filtra códigos CEFR ni la palabra CEFR", () => {
    expect(html).not.toMatch(/\b(A1|A2|B1|B2|C1|C2|CEFR)\b/);
  });
});
