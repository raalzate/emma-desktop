import { describe, expect, it } from "vitest";
import { buildSceneNarration } from "../scene-narration";
import type { SituationVariant } from "@/domain/situations/situation-variant";

const situacion: SituationVariant = {
  id: "standup-quiet",
  scenarioType: "daily_standup",
  title: "Quiet sprint morning",
  framingDescription:
    "Deliver a concise standup update. Flag the one risk you spotted in yesterday's code review.",
  character: "routine",
  cefrLevels: ["B1"],
  stackHints: [],
  retired: false,
};

const args = {
  scenarioTitle: "Daily Standup",
  scenarioDescription: "Your team's daily sync.",
  personaName: "Sofía Torres",
  personaRole: "Scrum Master",
};

describe("buildSceneNarration", () => {
  it("abre ambientando la escena con el título del escenario y la situación", () => {
    const beats = buildSceneNarration({ ...args, situation: situacion });
    expect(beats[0]).toEqual({ kind: "setting", text: "Daily Standup — Quiet sprint morning." });
  });

  it("narra la ambientación del carácter antes de presentar a la persona", () => {
    const beats = buildSceneNarration({ ...args, situation: situacion });
    const settingIdx = beats.findIndex((b) => b.text.startsWith("Picture an ordinary workday"));
    const characterIdx = beats.findIndex((b) => b.kind === "character");
    expect(settingIdx).toBeGreaterThan(0);
    expect(characterIdx).toBeGreaterThan(settingIdx);
  });

  it("presenta a la persona en segunda persona y en inglés", () => {
    const beats = buildSceneNarration({ ...args, situation: situacion });
    expect(beats.find((b) => b.kind === "character")?.text).toBe(
      "You're talking with Sofía Torres, your Scrum Master.",
    );
  });

  it("parte la misión en un compás por objetivo, al final", () => {
    const beats = buildSceneNarration({ ...args, situation: situacion });
    const mission = beats.filter((b) => b.kind === "mission");
    expect(mission).toHaveLength(2);
    expect(mission[0].text).toBe("Deliver a concise standup update.");
    expect(beats.at(-1)?.kind).toBe("mission");
  });

  it("sin situación cae a la descripción del escenario y sigue presentando a la persona", () => {
    const beats = buildSceneNarration({ ...args, situation: null });
    expect(beats.map((b) => b.text)).toEqual([
      "Daily Standup",
      "Your team's daily sync.",
      "You're talking with Sofía Torres, your Scrum Master.",
    ]);
  });

  it("no repite un compás cuando la descripción del escenario ya es el título", () => {
    const beats = buildSceneNarration({
      ...args,
      scenarioDescription: "Daily Standup",
      situation: null,
    });
    expect(beats.filter((b) => b.text === "Daily Standup")).toHaveLength(1);
  });

  it("descarta compases vacíos: una misión en blanco no pinta una burbuja vacía", () => {
    const beats = buildSceneNarration({
      ...args,
      situation: { ...situacion, framingDescription: "   " },
    });
    expect(beats.every((b) => b.text.trim().length > 0)).toBe(true);
    expect(beats.some((b) => b.kind === "mission")).toBe(false);
  });
});
