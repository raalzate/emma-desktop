/**
 * Puertos que necesita el resumen de continuidad, declarados en el dominio para
 * que la aplicación no importe nada de infraestructura (patrón hexagonal).
 * Equivalen al bundle SessionSummaryPorts del original Python.
 */

/** Un paso persistido del hilo Chainlit (mensaje de usuario/IA, etc.). */
export interface ContinuityThreadStep {
  type?: string;
  [key: string]: unknown;
}

/** Hilo persistido tal como lo devuelve la capa de datos. */
export interface ContinuityThread {
  id?: string | number;
  createdAt?: string;
  tags?: unknown;
  steps?: ContinuityThreadStep[];
}

/** latest_thread(user_identifier) -> thread o null (capa de datos Chainlit). */
export type LatestThread = (userIdentifier: unknown) => Promise<ContinuityThread | null>;

/** parse_scenario_type(tags) -> scenario_type o null (convención de tags). */
export type ParseScenarioType = (tags: unknown) => string | null;

/** resolve_scenario(scenario_type) -> [title, role] o null si no existe. */
export type ResolveScenario = (scenarioType: string) => readonly [string, string] | null;

/** max_turns_for(scenario_type) -> presupuesto de turnos (regla de dominio). */
export type MaxTurnsFor = (scenarioType: string) => number;

/** extract_text(step) -> texto plano de un paso persistido. */
export type ExtractText = (step: ContinuityThreadStep) => string;

/** Los cinco colaboradores del resumen, inyectados como un solo bundle. */
export interface ContinuityPorts {
  latestThread: LatestThread;
  parseScenarioType: ParseScenarioType;
  resolveScenario: ResolveScenario;
  maxTurnsFor: MaxTurnsFor;
  extractText: ExtractText;
}
