import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PendingLessonsNotice } from "@/components/progress/pending-lessons-notice";

describe("PendingLessonsNotice (FR-006, #198)", () => {
  it("explica en inglés que hay que cerrar las lecciones pendientes y enlaza a Mis lecciones", () => {
    const html = renderToStaticMarkup(createElement(PendingLessonsNotice));
    expect(html).toContain("Finish your pending lessons to unlock the next scene");
    expect(html).toMatch(/href="\/practice\/?"/);
    expect(html).toContain("My lessons");
  });

  it("el enlace lleva tooltip en español", () => {
    const html = renderToStaticMarkup(createElement(PendingLessonsNotice));
    expect(html).toContain("Abre Mis lecciones");
  });
});
