/**
 * Estado del updater tal como viaja del main al renderer (spec #137 FR-004).
 *
 * Lo que llega por IPC es entrada externa (Artículo 4): se valida con guardas
 * antes de tocar la UI. Basura ⇒ null y la UI la ignora; una acción desconocida
 * degrada a `manual`, porque avisar con un enlace de descarga nunca rompe nada.
 * Dominio puro.
 */

export type UpdateStatus =
  | { state: "checking" }
  | { state: "none"; version: string }
  | { state: "available"; version: string; action: "auto" | "manual" }
  | { state: "downloading"; percent: number }
  | { state: "ready"; version: string }
  | { state: "error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseUpdateStatus(value: unknown): UpdateStatus | null {
  if (!isRecord(value) || typeof value.state !== "string") return null;
  switch (value.state) {
    case "checking":
    case "error":
      return { state: value.state };
    case "none":
    case "ready":
      return typeof value.version === "string"
        ? { state: value.state, version: value.version }
        : null;
    case "available":
      if (typeof value.version !== "string") return null;
      return {
        state: "available",
        version: value.version,
        action: value.action === "auto" ? "auto" : "manual",
      };
    case "downloading":
      return typeof value.percent === "number" && Number.isFinite(value.percent)
        ? { state: "downloading", percent: value.percent }
        : null;
    default:
      return null;
  }
}
