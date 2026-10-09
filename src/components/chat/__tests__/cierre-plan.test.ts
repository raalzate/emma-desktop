/**
 * #211 — el cierre de la simulación en el diálogo: con lecciones asignadas una
 * sola acción lleva a «My lessons»; sin correcciones se pregunta practicar o
 * continuar. Nada de «Anotar» ni de botón «Close» visible.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ClosingPlanPanel } from "@/components/chat/closing-plan-panel";
import type { LessonTodoDraft } from "@/domain/lessons/lesson-todo";

const drafts: LessonTodoDraft[] = [
  {
    kind: "exercise",
    target: "u1-e1",
    titleEs: "Unit exercise",
    reasonEs: "Practica el verbo to be",
    href: "/practice/exercises/",
    origin: { sessionAt: 1, scenarioType: "daily_standup", scenarioTitle: "Daily Standup" },
  },
  {
    kind: "challenge",
    target: "unit-2",
    titleEs: "Unit 2 challenge",
    reasonEs: "Cuenta tu día",
    href: "/practice/challenges/",
    origin: { sessionAt: 1, scenarioType: "daily_standup", scenarioTitle: "Daily Standup" },
  },
];

const handlers = { onStartLessons: vi.fn(), onPracticeAgain: vi.fn(), onContinue: vi.fn() };
const render = (plan: Parameters<typeof ClosingPlanPanel>[0]["plan"]) =>
  renderToStaticMarkup(createElement(ClosingPlanPanel, { plan, ...handlers }));

describe("ClosingPlanPanel", () => {
  it("con lecciones asignadas lista cada una y ofrece una sola acción: Start my lessons", () => {
    const html = render({ kind: "lessons", drafts });
    expect(html).toContain("Unit exercise");
    expect(html).toContain("Unit 2 challenge");
    expect(html).toContain("Start my lessons");
    expect(html).toContain('title="Abre Mis lecciones');
    expect(html).not.toContain("Practice again");
    expect(html).not.toContain("Continue");
    expect(html).not.toContain("Close");
  });

  it("sin correcciones pregunta si practicar de nuevo o continuar", () => {
    const html = render({ kind: "choice" });
    expect(html).toContain(
      "Great work — nothing to fix this time. Practice this scene again or continue?",
    );
    expect(html).toContain("Practice again");
    expect(html).toContain("Continue");
    expect(html).not.toContain("Start my lessons");
  });

  it("sin plan todavía no pinta acciones", () => {
    expect(render(null)).toBe("");
  });

  it("el diálogo ya no ofrece «Anotar» ni el texto de guardar para después", () => {
    const src = readFileSync("src/components/chat/lesson-dialog.tsx", "utf8");
    expect(src).not.toContain("AnotarButton");
    expect(src).not.toContain("Save them and do them");
  });
});
