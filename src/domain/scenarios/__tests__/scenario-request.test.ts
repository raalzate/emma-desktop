import { describe, expect, it } from "vitest";
import { CEFR_LADDER, type CefrLevel } from "@/domain/cefr/cefr-ladder";
import { ALL_SCENARIOS } from "@/lib/scenarios-data";
import { scenariosForLevel } from "@/domain/scenarios/scenario-catalog";
import { resolveScenarioRequest } from "@/domain/scenarios/scenario-request";

// Un nivel y una escena del catálogo que NO es de ese nivel.
function sceneOutsideSomeLevel(): { level: CefrLevel; scenarioType: string } {
  for (const level of CEFR_LADDER) {
    const own = new Set(scenariosForLevel(level).map((s) => s.scenarioType));
    const other = ALL_SCENARIOS.find((s) => !own.has(s.scenarioType));
    if (other) return { level, scenarioType: other.scenarioType };
  }
  throw new Error("el catálogo no tiene escenas fuera de ningún nivel");
}

describe("resolveScenarioRequest", () => {
  it("sin escena pedida no hay nada que resolver", () => {
    expect(resolveScenarioRequest(undefined, "A1")).toEqual({ kind: "none" });
  });

  it("la escena pedida del nivel del aprendiz se abre", () => {
    const own = scenariosForLevel("A1")[0];
    const r = resolveScenarioRequest(own.scenarioType, "A1");
    expect(r).toEqual({ kind: "ok", scenario: own });
  });

  it("una escena de otro nivel NO se sustituye en silencio: se declara", () => {
    const { level, scenarioType } = sceneOutsideSomeLevel();
    const r = resolveScenarioRequest(scenarioType, level);
    expect(r.kind).toBe("other-level");
    if (r.kind === "other-level") expect(r.scenario.scenarioType).toBe(scenarioType);
  });

  it("una escena que no existe en el catálogo se declara desconocida", () => {
    expect(resolveScenarioRequest("no_such_scene", "A1")).toEqual({ kind: "unknown" });
  });
});
