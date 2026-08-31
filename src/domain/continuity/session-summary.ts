/**
 * Value object SessionSummary — lo que ve un aprendiz que regresa, en el
 * saludo de bienvenida (FR-001/003/016). Dominio puro: sin IO ni React.
 */

export const MAX_EXCHANGE_CHARS = 160;
const ELLIPSIS = "…";

/** Snapshot de la sesión sin terminar más reciente. */
export interface SessionSummary {
  threadId: string;
  scenarioTitle: string | null;
  learnerRole: string | null;
  lastExchange: string;
  occurredAt: string;
  degraded: boolean;
}

/** Truncado seguro en frontera de palabra con elipsis (FR-003). Determinista. */
export function truncateExchange(text: string, limit: number = MAX_EXCHANGE_CHARS): string {
  const stripped = text.trim();
  if (stripped.length <= limit) return stripped;
  const head = stripped.slice(0, limit - 1);
  const cut = head.includes(" ") ? head.slice(0, head.lastIndexOf(" ")) : head;
  return cut.replace(/\s+$/, "") + ELLIPSIS;
}

/**
 * Degradado cuando el escenario no se puede resolver o no hay nada que mostrar.
 * *scenario* es el par resuelto ``[title, learnerRole]`` o null cuando el
 * catálogo ya no conoce el tipo de escenario.
 */
export function buildSummary(
  threadId: string,
  scenario: readonly [string, string] | null,
  lastExchange: string,
  occurredAt: string,
): SessionSummary {
  const [title, role] = scenario ?? [null, null];
  const exchange = truncateExchange(lastExchange);
  return {
    threadId,
    scenarioTitle: title,
    learnerRole: role,
    lastExchange: exchange,
    occurredAt,
    degraded: title === null || !exchange,
  };
}
