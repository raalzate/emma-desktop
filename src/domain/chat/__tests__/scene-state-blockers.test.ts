/**
 * Reproduce el "perdió el hilo" del stand-up: con `yesterday` y `today` ya
 * cubiertos, la pregunta legítima de bloqueos menciona "today"/"progress" y el
 * guardia de re-preguntas la vetaba — dos generaciones rechazadas y la escena
 * caía en la línea de recuperación ("I lost my train of thought").
 */

import { describe, expect, it } from "vitest";
import { advanceScene, createSceneState, isReaskingCovered } from "@/domain/chat/scene-state";

function standupWithTwoItemsCovered() {
  const fresh = createSceneState("daily_standup");
  if (!fresh) throw new Error("daily_standup debe tener checklist");
  const afterToday = advanceScene(fresh, "i am working on the final testing phase for the new module.");
  // Sin señales propias de "yesterday", la evidencia es la pregunta que la
  // persona acaba de hacer (ver scene-attribution-honesta).
  return advanceScene(afterToday, "my plan is to finish the issues login", {
    lastAgentLine: "What did you do yesterday?",
  });
}

describe("guardia de re-preguntas en el stand-up", () => {
  it("deja pasar la pregunta de bloqueos aunque mencione 'today'", () => {
    const state = standupWithTwoItemsCovered();
    expect(state.pending[0]?.id).toBe("blockers");
    expect(isReaskingCovered("Is anything blocking you today?", state)).toBe(false);
  });

  it("deja pasar la pregunta de bloqueos aunque mencione 'progress'", () => {
    const state = standupWithTwoItemsCovered();
    expect(isReaskingCovered("Anything blocking your progress right now?", state)).toBe(false);
  });

  it("sigue vetando una re-pregunta real de lo ya respondido", () => {
    const state = standupWithTwoItemsCovered();
    expect(isReaskingCovered("So what did you work on yesterday?", state)).toBe(true);
    expect(isReaskingCovered("What is the plan for today?", state)).toBe(true);
  });
});
