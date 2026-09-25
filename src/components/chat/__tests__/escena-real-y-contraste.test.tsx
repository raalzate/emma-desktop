/**
 * #187: la franja de escena del chat y el modal «Tu escena» cuentan la
 * narrativa del contrato (la misma que la antesala), no la genérica; y nada
 * pinta texto blanco (`text-accent-foreground`) sobre el ámbar claro
 * (`bg-accent-soft`), donde no se distingue.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { SceneDialogBody } from "@/components/chat/scene-dialog";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";

const scenario = {
  scenarioType: "daily_standup",
  title: "Daily Standup",
  description: "Run a daily standup meeting with your team",
  emmaRole: "Scrum Master",
} as unknown as Scenario;

const situation: SituationVariant = {
  id: "standup-quiet",
  scenarioType: "daily_standup",
  title: "Quiet sprint morning",
  framingDescription: "Deliver a concise standup update.",
  character: "routine",
  cefrLevels: ["A1"],
  stackHints: [],
  retired: false,
};

const NARRATIVE = "You stand up to start the daily standup with your squad of five.";

describe("modal «Tu escena» (#187)", () => {
  it("cuenta la narrativa del contrato cuando existe", () => {
    const html = renderToStaticMarkup(
      createElement(SceneDialogBody, { scenario, situation, sceneReady: true, narrative: NARRATIVE }),
    );
    expect(html).toContain("squad of five");
    expect(html).not.toContain("Picture an ordinary workday");
  });

  it("sin narrativa cae al respaldo estático", () => {
    const html = renderToStaticMarkup(
      createElement(SceneDialogBody, { scenario, situation, sceneReady: true, narrative: null }),
    );
    expect(html).toContain("Picture an ordinary workday");
  });
});

describe("contraste sobre ámbar claro (#187)", () => {
  const files = [
    "scene-dialog.tsx",
    "scene-narration.tsx",
    "scene-intro.tsx",
    "composer.tsx",
    "teach-dialog.tsx",
  ];
  for (const file of files) {
    it(`${file} no usa text-accent-foreground (blanco) sobre bg-accent-soft`, () => {
      const src = fs.readFileSync(path.join(process.cwd(), "src/components/chat", file), "utf8");
      if (!src.includes("bg-accent-soft")) return;
      expect(src).not.toContain("text-accent-foreground");
    });
  }
});
