import { describe, expect, it } from "vitest";
import { initialSetupState, setupReducer, triggerForRun } from "@/components/setup/setup-check-state";
import { diagnoseSetup } from "@/domain/setup/diagnose-setup";

const verde = () =>
  diagnoseSetup({
    os: "mac",
    voice: { status: "ok", ms: 400, engine: "wasm" },
    ai: { status: "ok", ms: 900, mode: "local", online: true, readiness: "ok", localModelAvailable: true },
    mic: { status: "granted", devices: 1 },
  });

describe("setupReducer", () => {
  it("arranca sin diagnóstico ni corrida", () => {
    expect(initialSetupState).toEqual({ diagnosis: null, running: false, retesting: null, failed: false });
  });

  it("una corrida completa marca running y limpia el diagnóstico previo", () => {
    const s = setupReducer({ ...initialSetupState, diagnosis: verde() }, { type: "run-start" });
    expect(s).toMatchObject({ running: true, diagnosis: null, retesting: null });
  });

  it("al terminar guarda el diagnóstico y apaga running", () => {
    const d = verde();
    const s = setupReducer({ ...initialSetupState, running: true }, { type: "run-done", diagnosis: d });
    expect(s).toMatchObject({ running: false, diagnosis: d, failed: false });
  });

  it("un retest conserva el diagnóstico y señala la sonda", () => {
    const d = verde();
    const s = setupReducer({ ...initialSetupState, diagnosis: d }, { type: "retest-start", probe: "mic" });
    expect(s).toMatchObject({ diagnosis: d, retesting: "mic", running: false });
    expect(setupReducer(s, { type: "run-done", diagnosis: d }).retesting).toBeNull();
  });

  it("un error inesperado apaga los indicadores y lo marca", () => {
    const s = setupReducer({ ...initialSetupState, running: true, retesting: "ai" }, { type: "run-failed" });
    expect(s).toMatchObject({ running: false, retesting: null, failed: true });
  });
});

describe("triggerForRun", () => {
  it("la corrida automática inicial conserva el origen de la compuerta", () => {
    expect(triggerForRun("first-run", false)).toBe("first-run");
  });

  it("«Run again» y «Test again» son manuales (settings), aunque la compuerta sea first-run", () => {
    expect(triggerForRun("first-run", true)).toBe("settings");
  });

  it("una repetición no degrada un origen explícito ya manual", () => {
    expect(triggerForRun("settings", true)).toBe("settings");
    expect(triggerForRun("settings", false)).toBe("settings");
  });
});
