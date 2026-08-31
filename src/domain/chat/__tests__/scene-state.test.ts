import { describe, it, expect } from "vitest";
import {
  createSceneState,
  advanceScene,
  sceneDirective,
  isReaskingCovered,
  isSceneComplete,
  isSubstantive,
} from "../scene-state";

describe("isSubstantive — clasifica la respuesta del aprendiz (Observe)", () => {
  it("smalltalk y relleno NO son sustantivos", () => {
    expect(isSubstantive("yeah")).toBe(false);
    expect(isSubstantive("I am fine, thank you. How are you?")).toBe(false);
    expect(isSubstantive("I am good too. I am happy.")).toBe(false);
    expect(isSubstantive("ok sure")).toBe(false);
  });

  it("respuestas de trabajo con contenido SÍ son sustantivas", () => {
    expect(isSubstantive("I finished the report for Project Alpha.")).toBe(true);
    expect(isSubstantive("I need to finish the report by Friday.")).toBe(true);
    expect(isSubstantive("No blockers, everything is on track.")).toBe(true);
  });
});

describe("scene-state — checklist del escenario (Orient/Decide)", () => {
  // Todo escenario del catálogo tiene objetivos (ver lib/scene-checklists); el
  // flujo libre queda para un tipo desconocido, no para uno del catálogo.
  it("escenario sin checklist devuelve null", () => {
    expect(createSceneState("unknown_scenario")).toBeNull();
  });

  it("una respuesta sustantiva cubre el ítem pendiente y captura el hecho", () => {
    let state = createSceneState("daily_standup")!;
    state = advanceScene(state, "I finished the report for Project Alpha.");
    const directive = sceneDirective(state);
    expect(directive).toContain("I finished the report for Project Alpha.");
    expect(directive).toMatch(/do not ask.*again/i);
    expect(directive).toMatch(/TODAY/);
  });

  it("el relleno ('yeah') NO avanza el checklist", () => {
    let state = createSceneState("daily_standup")!;
    state = advanceScene(state, "yeah");
    expect(sceneDirective(state)).toMatch(/YESTERDAY/);
  });

  it("con todos los ítems cubiertos la directiva ordena cerrar la escena", () => {
    let state = createSceneState("daily_standup")!;
    state = advanceScene(state, "I finished the report yesterday.");
    state = advanceScene(state, "Today I will prepare the client demo.");
    state = advanceScene(state, "No blockers, everything is on track.");
    expect(sceneDirective(state)).toMatch(/summari[sz]e|close/i);
  });
});

describe("isSceneComplete — el agente decide terminar (BUG-001)", () => {
  it("false mientras queden ítems pendientes o no haya checklist", () => {
    let state = createSceneState("daily_standup")!;
    expect(isSceneComplete(state)).toBe(false);
    state = advanceScene(state, "I finished the report yesterday.");
    expect(isSceneComplete(state)).toBe(false);
    expect(isSceneComplete(null)).toBe(false);
  });

  it("true cuando el checklist está completo", () => {
    let state = createSceneState("daily_standup")!;
    state = advanceScene(state, "I finished the report yesterday.");
    state = advanceScene(state, "Today I will prepare the client demo.");
    state = advanceScene(state, "No blockers, everything is on track.");
    expect(isSceneComplete(state)).toBe(true);
  });
});

describe("isReaskingCovered — veto de re-preguntas (Verify)", () => {
  it("detecta cuando la persona re-pregunta un ítem ya cubierto", () => {
    let state = createSceneState("daily_standup")!;
    state = advanceScene(state, "I finished the report for Project Alpha.");
    state = advanceScene(state, "I need to finish the report by Friday.");
    expect(
      isReaskingCovered("So far, the progress is good, but we need to know what the next step is!", state),
    ).toBe(true);
    expect(isReaskingCovered("Great, so far so good! What's next?", state)).toBe(true);
  });

  it("no veta la pregunta por el ítem PENDIENTE", () => {
    let state = createSceneState("daily_standup")!;
    state = advanceScene(state, "I finished the report for Project Alpha.");
    state = advanceScene(state, "I need to finish the report by Friday.");
    expect(isReaskingCovered("Got it — is anything blocking you?", state)).toBe(false);
  });

  it("sin estado (escenario libre) nunca veta", () => {
    expect(isReaskingCovered("What is the next step?", null)).toBe(false);
  });
});
