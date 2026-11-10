/** Decisión pura de la compuerta de primer arranque (FR-031). */

export type GateView = "wait" | "check" | "pass";

export function gateView(a: { ready: boolean; needsCheck: boolean | null; dismissed: boolean }): GateView {
  if (!a.ready || a.needsCheck === null) return "wait";
  if (a.dismissed || !a.needsCheck) return "pass";
  return "check";
}
