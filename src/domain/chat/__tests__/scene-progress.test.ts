/** Avance de la escena expuesto a la UI (objetivos cubiertos / total). */

import { describe, expect, it } from "vitest";
import { advanceScene, createSceneState, sceneProgress } from "@/domain/chat/scene-state";

describe("sceneProgress", () => {
  it("arranca en cero sobre el total de objetivos del escenario", () => {
    expect(sceneProgress(createSceneState("daily_standup"))).toEqual({ done: 0, total: 3 });
  });

  it("cuenta los objetivos ya cubiertos", () => {
    const state = advanceScene(createSceneState("daily_standup")!, "yesterday i fixed the login bug.");
    expect(sceneProgress(state)).toEqual({ done: 1, total: 3 });
  });

  it("el total no cambia al avanzar", () => {
    let state = createSceneState("daily_standup")!;
    state = advanceScene(state, "yesterday i merged the PR.");
    state = advanceScene(state, "today i plan to run the load test.");
    state = advanceScene(state, "Nothing");
    expect(sceneProgress(state)).toEqual({ done: 3, total: 3 });
  });

  it("devuelve null en escenas sin checklist", () => {
    expect(sceneProgress(null)).toBeNull();
  });
});
