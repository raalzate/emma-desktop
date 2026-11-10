import { describe, it, expect } from "vitest";
import { REMEDIATIONS, type SetupCause } from "../setup-remediation";

const CAUSAS = Object.keys(REMEDIATIONS) as SetupCause[];
const GENERICOS = ["fix", "fix it", "retry", "try again", "error", "ok", "help", "learn more", "details"];

describe("catálogo de remediación", () => {
  it("cubre todas las causas del FR-030", () => {
    expect(CAUSAS.sort()).toEqual(
      [
        "no-webgpu", "low-ram", "ai-slow-local", "ai-slow-remote", "ai-no-response", "ai-empty",
        "ai-timeout", "ai-loading", "ai-offline", "voice-fallback", "voice-slow", "voice-timeout",
        "mic-denied", "mic-missing",
      ].sort(),
    );
  });

  it.each(CAUSAS)("%s tiene al menos una remediación accionable", (causa) => {
    expect(REMEDIATIONS[causa].length).toBeGreaterThanOrEqual(1);
  });

  it.each(CAUSAS)("%s: label en inglés no genérico y tooltip en español", (causa) => {
    for (const r of REMEDIATIONS[causa]) {
      expect(r.label.trim().length).toBeGreaterThan(4);
      expect(GENERICOS).not.toContain(r.label.trim().toLowerCase());
      expect(r.tooltipEs.trim().length).toBeGreaterThan(10);
      expect(r.tooltipEs).not.toBe(r.label);
    }
  });

  it.each(CAUSAS)("%s: las acciones de pasos traen pasos no vacíos", (causa) => {
    for (const { action } of REMEDIATIONS[causa]) {
      if (action.kind !== "steps") continue;
      expect(action.steps.length).toBeGreaterThan(0);
      for (const s of action.steps) expect(s.trim()).not.toBe("");
    }
  });

  it.each(["no-webgpu", "low-ram"] as const)("%s propone usar la nube", (causa) => {
    expect(REMEDIATIONS[causa].some((r) => r.action.kind === "open-cloud-setup")).toBe(true);
  });

  it("ai-offline propone cambiar al modelo local", () => {
    expect(REMEDIATIONS["ai-offline"].some((r) => r.action.kind === "switch-to-local")).toBe(true);
  });

  it("mic-denied trae pasos para mac, windows y linux", () => {
    const sos = REMEDIATIONS["mic-denied"].flatMap((r) => (r.action.kind === "steps" ? [r.action.os] : []));
    expect(sos).toEqual(expect.arrayContaining(["mac", "windows", "linux"]));
  });

  it("las causas de voz ofrecen repetir sólo la prueba de voz", () => {
    for (const c of ["voice-fallback", "voice-timeout"] as const) {
      expect(REMEDIATIONS[c].some((r) => r.action.kind === "retest" && r.action.probe === "voice")).toBe(true);
    }
  });
});
