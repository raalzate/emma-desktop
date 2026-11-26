/**
 * Escena pedida por deep-link (`/chat/?scenario=`) frente al nivel del aprendiz.
 *
 * El "why": la vista de chat buscaba la escena pedida sólo entre las del nivel
 * y, si no estaba, abría la primera del nivel sin decir nada: el enlace decía
 * Code review y la pantalla mostraba Daily Standup. Una escena de otro nivel
 * se declara para poder avisarlo, nunca se sustituye en silencio.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import { getScenario, scenariosForLevel } from "@/domain/scenarios/scenario-catalog";

export type ScenarioRequest =
  | { kind: "none" }
  | { kind: "ok"; scenario: Scenario }
  | { kind: "other-level"; scenario: Scenario }
  | { kind: "unknown" };

export function resolveScenarioRequest(requested: string | undefined, level: CefrLevel): ScenarioRequest {
  if (requested === undefined) return { kind: "none" };
  const scenario = getScenario(requested);
  if (!scenario) return { kind: "unknown" };
  const ofLevel = scenariosForLevel(level).some((s) => s.scenarioType === requested);
  return ofLevel ? { kind: "ok", scenario } : { kind: "other-level", scenario };
}
