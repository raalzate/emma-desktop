/**
 * Construye el resumen de bienvenida de la última sesión sin terminar del
 * aprendiz (FR-001/016). Todo el IO llega inyectado como puertos, así el caso
 * de uso no importa nada de capas externas y queda testeable.
 */

import type {
  ContinuityPorts,
  ContinuityThread,
  ContinuityThreadStep,
} from "@/domain/continuity/i-continuity-repository";
import { buildSummary, type SessionSummary } from "@/domain/continuity/session-summary";

export type BuildSessionSummaryArgs = ContinuityPorts & { userIdentifier: unknown };

/** Sesión terminada: ya se consumió el presupuesto de turnos del escenario. */
function isFinished(
  ports: ContinuityPorts,
  scenarioType: string,
  steps: ContinuityThreadStep[],
): boolean {
  const userTurns = steps.filter((s) => s.type === "user_message").length;
  return userTurns >= ports.maxTurnsFor(scenarioType);
}

/** Último paso con texto no vacío, recorriendo de atrás hacia adelante. */
function lastExchange(ports: ContinuityPorts, steps: ContinuityThreadStep[]): string {
  for (let i = steps.length - 1; i >= 0; i--) {
    const text = ports.extractText(steps[i]).trim();
    if (text) return text;
  }
  return "";
}

function summarize(
  ports: ContinuityPorts,
  thread: ContinuityThread,
  scenarioType: string,
  steps: ContinuityThreadStep[],
): SessionSummary {
  return buildSummary(
    String(thread.id ?? ""),
    ports.resolveScenario(scenarioType),
    lastExchange(ports, steps),
    String(thread.createdAt ?? ""),
  );
}

/** null cuando no hay simulación pendiente o la sesión ya está terminada. */
export async function buildSessionSummary(
  args: BuildSessionSummaryArgs,
): Promise<SessionSummary | null> {
  const { userIdentifier, ...ports } = args;
  const thread = (await ports.latestThread(userIdentifier)) ?? {};
  const scenarioType = ports.parseScenarioType(thread.tags);
  const steps = thread.steps ?? [];
  if (scenarioType === null || isFinished(ports, scenarioType, steps)) return null;
  return summarize(ports, thread, scenarioType, steps);
}
