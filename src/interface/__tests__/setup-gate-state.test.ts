import { describe, expect, it } from "vitest";
import { gateView } from "@/interface/setup-gate-state";

describe("gateView", () => {
  it("no muestra nada hasta que el runtime esté listo", () => {
    expect(gateView({ ready: false, needsCheck: null, dismissed: false })).toBe("wait");
  });

  it("espera mientras no sepa si hace falta el chequeo", () => {
    expect(gateView({ ready: true, needsCheck: null, dismissed: false })).toBe("wait");
  });

  it("sin marca previa muestra el chequeo", () => {
    expect(gateView({ ready: true, needsCheck: true, dismissed: false })).toBe("check");
  });

  it("con marca verde o onboarding completo deja pasar", () => {
    expect(gateView({ ready: true, needsCheck: false, dismissed: false })).toBe("pass");
  });

  it("tras Continue no vuelve a aparecer", () => {
    expect(gateView({ ready: true, needsCheck: true, dismissed: true })).toBe("pass");
  });
});
