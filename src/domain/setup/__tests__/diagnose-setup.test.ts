import { describe, it, expect } from "vitest";
import { diagnoseSetup, mergeDiagnosis, type ProbeDiagnosis, type SetupDiagnosis } from "../diagnose-setup";
import type { AiProbe, MicProbe, VoiceProbe } from "../setup-probe-result";

const voiceOk: VoiceProbe = { status: "ok", ms: 800, engine: "native" };
const aiOk: AiProbe = {
  status: "ok", ms: 2000, mode: "local", online: true, readiness: "ok", localModelAvailable: true,
  device: { webgpu: true, ramGB: 16, minRamGB: 8 },
};
const micOk: MicProbe = { status: "granted", devices: 1 };

const ai = (p: Partial<AiProbe>): AiProbe => ({ ...aiOk, ...p });
const probe = (d: SetupDiagnosis, name: "voice" | "ai" | "mic"): ProbeDiagnosis => {
  const found = d.probes.find((x) => x.probe === name);
  if (!found) throw new Error(`falta la sonda ${name}`);
  return found;
};
const actions = (p: ProbeDiagnosis) => p.remediations.map((r) => r.action.kind);

describe("diagnoseSetup — todo bien", () => {
  it("con las tres sondas sanas el veredicto es pass", () => {
    const d = diagnoseSetup({ voice: voiceOk, ai: aiOk, mic: micOk, os: "mac" });
    expect(d.verdict).toBe("pass");
    expect(d.probes.map((p) => p.probe)).toEqual(["voice", "ai", "mic"]);
    for (const p of d.probes) {
      expect(p.severity).toBe("ok");
      expect(p.causes).toEqual([]);
      expect(p.remediations).toEqual([]);
    }
  });

  it("sólo diagnostica las sondas presentes", () => {
    const d = diagnoseSetup({ voice: voiceOk, os: "linux" });
    expect(d.probes.map((p) => p.probe)).toEqual(["voice"]);
  });
});

describe("diagnoseSetup — voz", () => {
  it.each([
    [1999, "ok", "ok"],
    [2000, "warning", "slow"],
    [5000, "warning", "very-slow"],
  ] as const)("voz nativa a %i ms es %s (%s)", (ms, severity, speed) => {
    const p = probe(diagnoseSetup({ voice: { ...voiceOk, ms }, os: "mac" }), "voice");
    expect(p.severity).toBe(severity);
    expect(p.speed).toBe(speed);
    expect(p.ms).toBe(ms);
    if (severity === "warning") expect(p.causes).toEqual(["voice-slow"]);
  });

  it("caída a Web Speech es voice-fallback (warning) aunque sea rápida", () => {
    const p = probe(diagnoseSetup({ voice: { status: "ok", ms: 300, engine: "web-speech" }, os: "mac" }), "voice");
    expect(p.severity).toBe("warning");
    expect(p.causes).toContain("voice-fallback");
  });

  it("error de voz es voice-fallback y timeout es voice-timeout; ambos no bloquean", () => {
    const err = probe(diagnoseSetup({ voice: { status: "error", engine: "none" }, os: "mac" }), "voice");
    const tmo = probe(diagnoseSetup({ voice: { status: "timeout", engine: "none" }, os: "mac" }), "voice");
    expect(err.causes).toEqual(["voice-fallback"]);
    expect(tmo.causes).toEqual(["voice-timeout"]);
    expect(err.severity).toBe("warning");
    expect(tmo.severity).toBe("warning");
    expect(actions(tmo)).toContain("retest");
  });
});

describe("diagnoseSetup — micrófono", () => {
  it("denegado da pasos sólo del sistema operativo actual", () => {
    const p = probe(diagnoseSetup({ mic: { status: "denied", devices: 1 }, os: "windows" }), "mic");
    expect(p.severity).toBe("warning");
    expect(p.causes).toEqual(["mic-denied"]);
    expect(p.remediations).toHaveLength(1);
    expect(p.remediations[0].action).toMatchObject({ kind: "steps", os: "windows" });
  });

  it.each([
    [{ status: "no-device", devices: 0 }],
    [{ status: "granted", devices: 0 }],
    [{ status: "unknown", devices: 0 }],
  ] as const)("sin dispositivo (%j) es mic-missing", (mic) => {
    const p = probe(diagnoseSetup({ mic, os: "linux" }), "mic");
    expect(p.causes).toEqual(["mic-missing"]);
    expect(p.severity).toBe("warning");
  });

  it("unknown con dispositivos (Linux) no alarma", () => {
    const p = probe(diagnoseSetup({ mic: { status: "unknown", devices: 2 }, os: "linux" }), "mic");
    expect(p.severity).toBe("ok");
  });

  it("timeout del micrófono avisa y ofrece repetir sólo esa prueba", () => {
    const p = probe(diagnoseSetup({ mic: { status: "timeout", devices: 0 }, os: "mac" }), "mic");
    expect(p.severity).toBe("warning");
    expect(p.remediations.map((r) => r.action)).toContainEqual({ kind: "retest", probe: "mic" });
  });
});

describe("diagnoseSetup — IA", () => {
  it.each([
    [4999, "ok", "ok"],
    [5000, "warning", "slow"],
    [15000, "warning", "very-slow"],
  ] as const)("IA local a %i ms es %s (%s)", (ms, severity, speed) => {
    const p = probe(diagnoseSetup({ ai: ai({ ms }), os: "mac" }), "ai");
    expect(p.severity).toBe(severity);
    expect(p.speed).toBe(speed);
    if (severity === "warning") expect(p.causes).toEqual(["ai-slow-local"]);
  });

  it("IA remota lenta es ai-slow-remote", () => {
    const p = probe(diagnoseSetup({ ai: ai({ mode: "remote", ms: 9000 }), os: "mac" }), "ai");
    expect(p.causes).toEqual(["ai-slow-remote"]);
  });

  it("respuesta vacía con motor alternativo es warning ai-empty", () => {
    const p = probe(diagnoseSetup({ ai: ai({ status: "empty", mode: "hybrid" }), os: "mac" }), "ai");
    expect(p.severity).toBe("warning");
    expect(p.causes).toContain("ai-empty");
  });

  it("error de un motor remoto sin modelo local bloquea (ai-no-response)", () => {
    const p = probe(diagnoseSetup({ ai: ai({ status: "error", mode: "remote", localModelAvailable: false }), os: "mac" }), "ai");
    expect(p.severity).toBe("blocking");
    expect(p.causes).toContain("ai-no-response");
  });

  it("timeout remoto con modelo local disponible no bloquea y ofrece switch-to-local", () => {
    const p = probe(diagnoseSetup({ ai: ai({ status: "timeout", mode: "remote", localModelAvailable: true }), os: "mac" }), "ai");
    expect(p.severity).toBe("warning");
    expect(p.causes).toContain("ai-timeout");
    expect(actions(p)).toContain("switch-to-local");
  });

  it("timeout local (carga en frío) no bloquea y señala ai-slow-local", () => {
    const p = probe(diagnoseSetup({ ai: ai({ status: "timeout", mode: "local" }), os: "mac" }), "ai");
    expect(p.severity).toBe("warning");
    expect(p.causes).toEqual(expect.arrayContaining(["ai-timeout", "ai-slow-local"]));
  });

  it("sin motor utilizable (readiness distinto de ok) bloquea", () => {
    const p = probe(
      diagnoseSetup({ ai: ai({ status: "error", readiness: "no-model", localModelAvailable: false }), os: "mac" }),
      "ai",
    );
    expect(p.severity).toBe("blocking");
  });

  it("no ofrece switch-to-local si no hay modelo local", () => {
    const p = probe(
      diagnoseSetup({ ai: ai({ status: "error", mode: "remote", localModelAvailable: false }), os: "mac" }),
      "ai",
    );
    expect(actions(p)).not.toContain("switch-to-local");
  });

  it("sin WebGPU y fallo local propone la nube (recommendEngine)", () => {
    const p = probe(
      diagnoseSetup({
        ai: ai({ status: "error", readiness: "no-model", localModelAvailable: false, device: { webgpu: false, minRamGB: 8 } }),
        os: "mac",
      }),
      "ai",
    );
    expect(p.causes).toContain("no-webgpu");
    expect(actions(p)).toContain("open-cloud-setup");
  });

  it("poca RAM y fallo local es low-ram", () => {
    const p = probe(
      diagnoseSetup({ ai: ai({ status: "timeout", device: { webgpu: true, ramGB: 4, minRamGB: 8 } }), os: "mac" }),
      "ai",
    );
    expect(p.causes).toContain("low-ram");
  });

  it("IA sana no arrastra causas de dispositivo", () => {
    const p = probe(diagnoseSetup({ ai: ai({ device: { webgpu: false, minRamGB: 8 } }), os: "mac" }), "ai");
    expect(p.causes).toEqual([]);
  });
});

describe("diagnoseSetup — offline (H7)", () => {
  it("offline con modo nube y modelo local es ai-offline + switch-to-local, sin bloquear", () => {
    const p = probe(
      diagnoseSetup({ ai: ai({ mode: "remote", online: false, status: "error", localModelAvailable: true }), os: "mac" }),
      "ai",
    );
    expect(p.causes).toContain("ai-offline");
    expect(actions(p)).toContain("switch-to-local");
    expect(p.severity).toBe("warning");
  });

  it("offline con modo nube y sin modelo local bloquea y no ofrece switch-to-local", () => {
    const p = probe(
      diagnoseSetup({ ai: ai({ mode: "remote", online: false, status: "error", localModelAvailable: false }), os: "mac" }),
      "ai",
    );
    expect(p.causes).toContain("ai-offline");
    expect(p.severity).toBe("blocking");
    expect(actions(p)).not.toContain("switch-to-local");
    expect(actions(p)).toContain("open-model-manager");
  });

  it("offline con modo local no es ai-offline", () => {
    const p = probe(diagnoseSetup({ ai: ai({ mode: "local", online: false }), os: "mac" }), "ai");
    expect(p.causes).toEqual([]);
  });
});

describe("diagnoseSetup — matriz de veredicto (FR-032)", () => {
  const bloqueante = ai({ status: "error", mode: "remote", localModelAvailable: false });
  it.each([
    ["todo ok", { voice: voiceOk, ai: aiOk, mic: micOk }, "pass"],
    ["voz lenta", { voice: { ...voiceOk, ms: 3000 }, ai: aiOk, mic: micOk }, "warn"],
    ["mic denegado", { voice: voiceOk, ai: aiOk, mic: { status: "denied", devices: 1 } }, "warn"],
    ["IA lenta", { voice: voiceOk, ai: ai({ ms: 9000 }), mic: micOk }, "warn"],
    ["sin motor", { voice: voiceOk, ai: bloqueante, mic: micOk }, "blocked"],
    ["sin motor y voz caída", { voice: { status: "error", engine: "none" }, ai: bloqueante, mic: micOk }, "blocked"],
  ] as const)("%s ⇒ %s", (_n, m, veredicto) => {
    expect(diagnoseSetup({ ...m, os: "mac" } as Parameters<typeof diagnoseSetup>[0]).verdict).toBe(veredicto);
  });
});

describe("mergeDiagnosis (Test again de una prueba, H5)", () => {
  const bloqueado = diagnoseSetup({
    voice: { status: "error", engine: "none" },
    ai: ai({ status: "error", mode: "remote", localModelAvailable: false }),
    mic: micOk,
    os: "mac",
  });

  it("reemplaza sólo la sonda repetida y recalcula el veredicto", () => {
    const rerun = probe(diagnoseSetup({ ai: aiOk, os: "mac" }), "ai");
    const merged = mergeDiagnosis(bloqueado, rerun);
    expect(probe(merged, "ai").severity).toBe("ok");
    expect(probe(merged, "voice")).toEqual(probe(bloqueado, "voice"));
    expect(merged.verdict).toBe("warn");
  });

  it("mantiene el orden voz, IA, micrófono", () => {
    const rerun = probe(diagnoseSetup({ voice: voiceOk, os: "mac" }), "voice");
    expect(mergeDiagnosis(bloqueado, rerun).probes.map((p) => p.probe)).toEqual(["voice", "ai", "mic"]);
  });

  it("agrega la sonda si no estaba y no muta el original", () => {
    const base = diagnoseSetup({ voice: voiceOk, os: "mac" });
    const merged = mergeDiagnosis(base, probe(diagnoseSetup({ mic: micOk, os: "mac" }), "mic"));
    expect(merged.probes.map((p) => p.probe)).toEqual(["voice", "mic"]);
    expect(base.probes).toHaveLength(1);
  });

  it("pasa a pass cuando todas quedan sanas", () => {
    let d = bloqueado;
    d = mergeDiagnosis(d, probe(diagnoseSetup({ voice: voiceOk, os: "mac" }), "voice"));
    d = mergeDiagnosis(d, probe(diagnoseSetup({ ai: aiOk, os: "mac" }), "ai"));
    expect(d.verdict).toBe("pass");
  });
});

describe("diagnoseSetup — ms enteros y carga en frío", () => {
  it("redondea ms de voz, IA y carga al entero", () => {
    const d = diagnoseSetup({
      voice: { ...voiceOk, ms: 8356.399999976158 }, ai: ai({ ms: 1234.6, loadMs: 17000.4 }), os: "mac",
    });
    expect(probe(d, "voice").ms).toBe(8356);
    expect(probe(d, "ai").ms).toBe(1235);
    expect(probe(d, "ai").loadMs).toBe(17000);
  });

  it("la carga del modelo NO cuenta como lentitud: sólo la inferencia se clasifica", () => {
    const p = probe(diagnoseSetup({ ai: ai({ ms: 900, loadMs: 17000 }), os: "mac" }), "ai");
    expect(p.severity).toBe("ok");
    expect(p.speed).toBe("ok");
    expect(p.causes).toEqual([]);
    expect(p.loadMs).toBe(17000);
  });

  it("inferencia lenta sigue siendo ai-slow-local aunque haya carga", () => {
    const p = probe(diagnoseSetup({ ai: ai({ ms: 6000, loadMs: 17000 }), os: "mac" }), "ai");
    expect(p.causes).toEqual(["ai-slow-local"]);
  });

  it("timeout durante la carga: ai-loading (warning), sin ai-slow-local ni «smaller model»", () => {
    const p = probe(diagnoseSetup({ ai: ai({ status: "timeout", ms: undefined, loadingModel: true }), os: "mac" }), "ai");
    expect(p.severity).toBe("warning");
    expect(p.causes).toEqual(["ai-loading"]);
    expect(p.summary).toMatch(/still loading/i);
    expect(p.remediations.map((r) => r.action)).toEqual([{ kind: "retest", probe: "ai" }]);
  });
});
