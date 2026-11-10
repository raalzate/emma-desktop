import { describe, expect, it } from "vitest";
import { PROBE_TIMEOUT_MS } from "@/domain/setup/setup-thresholds";
import { SETUP_CHECK_VERSION } from "@/domain/setup/setup-check-record";
import { runSetupCheck } from "../run-setup-check-use-case";
import { IA_OK, MIC_OK, colgada, relojFalso, repoFalso, sondaFalsa } from "./fakes";

const base = { os: "mac", trigger: "settings" } as const;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe("runSetupCheck", () => {
  it("con todas las sondas bien devuelve pass y persiste el registro", async () => {
    const repo = repoFalso();
    const d = await runSetupCheck({ ...base, probe: sondaFalsa(), repo, clock: relojFalso(5000) });
    expect(d.verdict).toBe("pass");
    expect(d.probes.map((p) => p.probe)).toEqual(["voice", "ai", "mic"]);
    expect(repo.registros).toHaveLength(1);
    expect(repo.registros[0]).toMatchObject({
      version: SETUP_CHECK_VERSION, at: 5000, trigger: "settings", acknowledged: false, diagnosis: d,
    });
  });

  it("lanza las tres sondas en paralelo (todas arrancan antes de que alguna termine)", async () => {
    const iniciadas: string[] = [];
    const probe = sondaFalsa({
      probeVoice: () => { iniciadas.push("voice"); return colgada(); },
      probeAi: () => { iniciadas.push("ai"); return colgada(); },
      probeMic: () => { iniciadas.push("mic"); return colgada(); },
    });
    const clock = relojFalso();
    const p = runSetupCheck({ ...base, probe, repo: repoFalso(), clock });
    await tick();
    expect(iniciadas).toEqual(["voice", "ai", "mic"]);
    expect(clock.pendientes().sort()).toEqual(
      [PROBE_TIMEOUT_MS.mic, PROBE_TIMEOUT_MS.voice, PROBE_TIMEOUT_MS.ai].sort(),
    );
    for (const ms of Object.values(PROBE_TIMEOUT_MS)) clock.disparar(ms);
    await p;
  });

  it("una sonda que agota su tope se marca timeout y no aborta las demás", async () => {
    let senal: AbortSignal | undefined;
    const probe = sondaFalsa({ probeVoice: (s) => { senal = s; return colgada(); } });
    const clock = relojFalso();
    const p = runSetupCheck({ ...base, probe, repo: repoFalso(), clock });
    await tick();
    clock.disparar(PROBE_TIMEOUT_MS.voice);
    const d = await p;
    expect(d.probes.find((x) => x.probe === "voice")?.causes).toContain("voice-timeout");
    expect(d.probes.find((x) => x.probe === "ai")?.severity).toBe("ok");
    expect(d.probes.find((x) => x.probe === "mic")?.severity).toBe("ok");
    expect(senal?.aborted).toBe(true);
  });

  it("el tope de cada sonda es el de PROBE_TIMEOUT_MS y el temporizador se cancela al terminar", async () => {
    const clock = relojFalso();
    await runSetupCheck({ ...base, probe: sondaFalsa(), repo: repoFalso(), clock });
    expect(clock.pendientes()).toEqual([]);
  });

  it("una excepción en una sonda se traduce a error y las otras siguen", async () => {
    const probe = sondaFalsa({ probeAi: async () => { throw new Error("boom"); } });
    const d = await runSetupCheck({ ...base, probe, repo: repoFalso(), clock: relojFalso() });
    const ai = d.probes.find((x) => x.probe === "ai");
    expect(ai?.severity).toBe("blocking");
    expect(ai?.causes).toContain("ai-no-response");
    expect(d.verdict).toBe("blocked");
    expect(d.probes.find((x) => x.probe === "voice")?.severity).toBe("ok");
  });

  it("una excepción síncrona de la sonda tampoco rompe el chequeo", async () => {
    const probe = sondaFalsa({ probeMic: () => { throw new Error("sync"); } });
    const d = await runSetupCheck({ ...base, probe, repo: repoFalso(), clock: relojFalso() });
    expect(d.probes.find((x) => x.probe === "mic")?.severity).toBe("warning");
  });

  it("la IA que agota su tope en modo local es advertencia (ai-timeout)", async () => {
    const probe = sondaFalsa({ probeAi: () => colgada() });
    const clock = relojFalso();
    const p = runSetupCheck({ ...base, probe, repo: repoFalso(), clock });
    await tick();
    clock.disparar(PROBE_TIMEOUT_MS.ai);
    const d = await p;
    expect(d.probes.find((x) => x.probe === "ai")?.causes).toContain("ai-timeout");
  });

  it("un repositorio que falla al guardar no bloquea ni rompe el resultado", async () => {
    const repo = { ...repoFalso(), append: async () => { throw new Error("disco"); } };
    const d = await runSetupCheck({ ...base, probe: sondaFalsa(), repo, clock: relojFalso() });
    expect(d.verdict).toBe("pass");
  });

  describe("only", () => {
    it("re-corre una sola sonda y fusiona con el resultado previo", async () => {
      const repo = repoFalso();
      const falla = sondaFalsa({ probeMic: async () => ({ status: "denied", devices: 1 }) });
      const antes = await runSetupCheck({ ...base, probe: falla, repo, clock: relojFalso() });
      expect(antes.verdict).toBe("warn");

      const llamadas: string[] = [];
      const probe = sondaFalsa({
        probeVoice: async () => { llamadas.push("voice"); return { status: "ok", engine: "native" }; },
        probeAi: async () => { llamadas.push("ai"); return IA_OK; },
        probeMic: async () => { llamadas.push("mic"); return MIC_OK; },
      });
      const d = await runSetupCheck({ ...base, probe, repo, clock: relojFalso(), only: "mic" });
      expect(llamadas).toEqual(["mic"]);
      expect(d.probes.map((p) => p.probe)).toEqual(["voice", "ai", "mic"]);
      expect(d.verdict).toBe("pass");
      expect(repo.registros).toHaveLength(2);
      expect(repo.registros[1].diagnosis).toEqual(d);
    });

    it("sin resultado previo devuelve sólo esa sonda", async () => {
      const d = await runSetupCheck({
        ...base, probe: sondaFalsa(), repo: repoFalso(), clock: relojFalso(), only: "voice",
      });
      expect(d.probes.map((p) => p.probe)).toEqual(["voice"]);
    });

    it("una sonda sola que agota su tope también se marca timeout", async () => {
      const probe = sondaFalsa({ probeMic: () => colgada() });
      const clock = relojFalso();
      const p = runSetupCheck({ ...base, probe, repo: repoFalso(), clock, only: "mic" });
      await tick();
      clock.disparar(PROBE_TIMEOUT_MS.mic);
      const d = await p;
      expect(d.probes[0].probe).toBe("mic");
      expect(d.probes[0].severity).toBe("warning");
    });

    it("si el repositorio falla al leer lo previo, devuelve sólo esa sonda", async () => {
      const repo = { ...repoFalso(), last: async () => { throw new Error("json roto"); } };
      const d = await runSetupCheck({ ...base, probe: sondaFalsa(), repo, clock: relojFalso(), only: "ai" });
      expect(d.probes.map((p) => p.probe)).toEqual(["ai"]);
    });
  });
});
