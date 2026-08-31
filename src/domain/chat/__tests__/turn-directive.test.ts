/**
 * Una sola orden por turno.
 *
 * El defecto: las directivas se concatenaban y se contradecían entre sí — "ask
 * ONLY about their plan for TODAY" junto a "ask ONE follow-up about that same
 * thing, without changing the topic", o junto a "do NOT ask any further
 * questions" al borde del presupuesto. Ante órdenes opuestas el modelo pequeño
 * se rendía y devolvía un "Great!" que no preguntaba nada.
 */

import { describe, expect, it } from "vitest";
import { advanceScene, createSceneState } from "@/domain/chat/scene-state";
import { buildTurnDirective } from "@/domain/chat/turn-directive";

function standupAfterFirstAnswer() {
  const state = createSceneState("daily_standup");
  if (!state) throw new Error("daily_standup debe tener checklist");
  return advanceScene(state, "I finished the report for the client.");
}

const base = { state: null, elaborate: false, deepen: false, wrapUp: false, recastCue: "" };

describe("buildTurnDirective", () => {
  it("pide el siguiente tema cuando no hay nada más en juego", () => {
    const d = buildTurnDirective({ ...base, state: standupAfterFirstAnswer() });
    expect(d).toContain("their plan for TODAY");
    expect(d.toLowerCase()).toContain("react to");
  });

  it("al pedir detalle NO ordena además cambiar de tema", () => {
    const d = buildTurnDirective({ ...base, state: standupAfterFirstAnswer(), elaborate: true });
    expect(d.toLowerCase()).toMatch(/follow-up|more detail/);
    expect(d).not.toContain("ask ONLY about");
    expect(d.toLowerCase()).not.toContain("their plan for today");
  });

  it("al cerrar NO ordena además preguntar el siguiente tema", () => {
    const d = buildTurnDirective({ ...base, state: standupAfterFirstAnswer(), wrapUp: true });
    expect(d.toLowerCase()).toContain("do not ask any further questions");
    expect(d).not.toContain("ask ONLY about");
  });

  it("el cierre manda sobre la petición de detalle", () => {
    const d = buildTurnDirective({
      ...base,
      state: standupAfterFirstAnswer(),
      elaborate: true,
      wrapUp: true,
    });
    expect(d.toLowerCase()).toContain("do not ask any further questions");
    expect(d.toLowerCase()).not.toMatch(/ask one specific follow-up/);
  });

  it("nunca emite dos órdenes de pregunta a la vez", () => {
    const combos = [
      { elaborate: true, deepen: false, wrapUp: false },
      { elaborate: false, deepen: true, wrapUp: false },
      { elaborate: true, deepen: true, wrapUp: false },
      { elaborate: true, deepen: true, wrapUp: true },
    ];
    for (const c of combos) {
      const d = buildTurnDirective({ ...base, state: standupAfterFirstAnswer(), ...c });
      // Marcadores exactos de cada orden. Ojo: "Do NOT ask about those again"
      // pertenece a los hechos ya sabidos, no es una orden de pregunta.
      const orders = [
        /ask ONLY about/.test(d),
        /ask ONE specific follow-up/i.test(d),
        /do not ask any further questions/i.test(d),
      ];
      expect(orders.filter(Boolean), JSON.stringify(c)).toHaveLength(1);
    }
  });

  it("añade el recast, que es de forma y no compite con la orden", () => {
    const d = buildTurnDirective({
      ...base,
      state: standupAfterFirstAnswer(),
      recastCue: 'RECAST — correct phrasing: "I finished the client report."',
    });
    expect(d).toContain("their plan for TODAY");
    expect(d).toContain("RECAST");
  });

  it("funciona en escenas sin checklist", () => {
    expect(buildTurnDirective(base)).toBe("");
    expect(buildTurnDirective({ ...base, elaborate: true }).toLowerCase()).toMatch(/follow-up/);
  });
});
