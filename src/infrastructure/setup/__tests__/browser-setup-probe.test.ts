import { describe, expect, it, vi } from "vitest";
import { createBrowserSetupProbe, type BrowserProbeDeps } from "../browser-setup-probe";

/** Reloj falso: cada llamada avanza `step` ms. */
function clock(step = 120) {
  let t = 1000;
  return () => (t += step);
}

function deps(over: Partial<BrowserProbeDeps> = {}): BrowserProbeDeps {
  return {
    now: clock(),
    synthesize: async () => ({ backend: "native" }),
    webSpeechAvailable: () => true,
    readiness: async () => ({ ready: true, mode: "local", reason: "ok" }),
    device: async () => ({ webgpu: true, ramGB: 16, minRamGB: 8 }),
    online: () => true,
    localModelAvailable: async () => true,
    llm: async () => "OK",
    micAccessStatus: async () => "granted",
    audioInputs: async () => 1,
    ...over,
  };
}

const live = () => new AbortController().signal;

describe("probeVoice (FR-025)", () => {
  it("mide ms y reporta el motor nativo o WASM que respondió", async () => {
    for (const backend of ["native", "wasm"] as const) {
      const r = await createBrowserSetupProbe(deps({ synthesize: async () => ({ backend }) })).probeVoice(live());
      expect(r).toMatchObject({ status: "ok", engine: backend, ms: 120 });
    }
  });

  it("si la cadena rechaza y hay Web Speech, reporta web-speech sin ms", async () => {
    const r = await createBrowserSetupProbe(deps({ synthesize: async () => { throw new Error("sin voz"); } })).probeVoice(live());
    expect(r).toMatchObject({ status: "ok", engine: "web-speech" });
    expect(r.ms).toBeUndefined();
  });

  it("si la cadena rechaza y tampoco hay Web Speech, es error sin motor", async () => {
    const r = await createBrowserSetupProbe(
      deps({ synthesize: async () => { throw new Error("x"); }, webSpeechAvailable: () => false }),
    ).probeVoice(live());
    expect(r).toMatchObject({ status: "error", engine: "none" });
  });

  it("usa la frase fija y el presupuesto de la sonda", async () => {
    const synthesize = vi.fn(async () => ({ backend: "wasm" as const }));
    await createBrowserSetupProbe(deps({ synthesize })).probeVoice(live());
    expect(synthesize).toHaveBeenCalledWith(expect.stringMatching(/\w+/), 15000);
  });

  it("respeta el AbortSignal: abortada, devuelve timeout aunque la cadena no responda", async () => {
    const ctl = new AbortController();
    const probe = createBrowserSetupProbe(deps({ synthesize: () => new Promise(() => {}) }));
    const pending = probe.probeVoice(ctl.signal);
    ctl.abort();
    await expect(pending).resolves.toMatchObject({ status: "timeout", engine: "none" });
  });
});

describe("probeAi (FR-026, FR-033)", () => {
  it("ok: respuesta no vacía, con ms, modo, dispositivo y conexión", async () => {
    const r = await createBrowserSetupProbe(deps()).probeAi(live());
    expect(r).toMatchObject({
      status: "ok", ms: 120, mode: "local", online: true, readiness: "ok", localModelAvailable: true,
      device: { webgpu: true, ramGB: 16, minRamGB: 8 },
    });
  });

  it("manda el prompt corto por el puerto LlmGenerate con prioridad interactiva y la señal", async () => {
    const llm = vi.fn(async () => "OK");
    const signal = live();
    await createBrowserSetupProbe(deps({ llm })).probeAi(signal);
    expect(llm).toHaveBeenCalledWith(expect.objectContaining({ priority: "interactive", maxTokens: 8, signal }));
  });

  it("respuesta vacía o sólo espacios ⇒ empty", async () => {
    const r = await createBrowserSetupProbe(deps({ llm: async () => "  \n " })).probeAi(live());
    expect(r.status).toBe("empty");
  });

  it("respuesta que no es string ⇒ empty (borde)", async () => {
    const llm = (async () => 42) as unknown as BrowserProbeDeps["llm"];
    expect((await createBrowserSetupProbe(deps({ llm })).probeAi(live())).status).toBe("empty");
  });

  it("el LLM lanza ⇒ error con detalle acotado", async () => {
    const r = await createBrowserSetupProbe(deps({ llm: async () => { throw new Error("boom"); } })).probeAi(live());
    expect(r).toMatchObject({ status: "error", detail: "boom" });
  });

  it("un AbortError del LLM ⇒ timeout", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    const r = await createBrowserSetupProbe(deps({ llm: async () => { throw abort; } })).probeAi(live());
    expect(r.status).toBe("timeout");
  });

  it("respeta el AbortSignal aunque el LLM lo ignore", async () => {
    const ctl = new AbortController();
    const pending = createBrowserSetupProbe(deps({ llm: () => new Promise(() => {}) })).probeAi(ctl.signal);
    await new Promise((r) => setTimeout(r, 0));
    ctl.abort();
    await expect(pending).resolves.toMatchObject({ status: "timeout" });
  });

  it("sin motor listo no envía prompt: error con la razón de readiness", async () => {
    const llm = vi.fn(async () => "OK");
    const r = await createBrowserSetupProbe(
      deps({ llm, readiness: async () => ({ ready: false, mode: "local", reason: "no-model" }), localModelAvailable: async () => false }),
    ).probeAi(live());
    expect(llm).not.toHaveBeenCalled();
    expect(r).toMatchObject({ status: "error", readiness: "no-model", localModelAvailable: false });
  });

  it("reporta el modo que devolvió checkAiReadiness (auto-cura de #280), no el previo", async () => {
    const r = await createBrowserSetupProbe(deps({ readiness: async () => ({ ready: true, mode: "local", reason: "ok" }) })).probeAi(live());
    expect(r.mode).toBe("local");
  });

  it("llama a readiness ANTES del prompt", async () => {
    const orden: string[] = [];
    await createBrowserSetupProbe(
      deps({
        readiness: async () => (orden.push("readiness"), { ready: true, mode: "remote", reason: "ok" }),
        llm: async () => (orden.push("llm"), "OK"),
      }),
    ).probeAi(live());
    expect(orden).toEqual(["readiness", "llm"]);
  });

  it("offline se refleja; fallos de dispositivo/modelos no rompen la sonda", async () => {
    const r = await createBrowserSetupProbe(
      deps({
        online: () => false,
        device: async () => { throw new Error("x"); },
        localModelAvailable: async () => { throw new Error("y"); },
      }),
    ).probeAi(live());
    expect(r).toMatchObject({ status: "ok", online: false, localModelAvailable: false });
    expect(r.device).toBeUndefined();
  });
});

describe("probeMic (FR-027)", () => {
  const mic = (status: Awaited<ReturnType<BrowserProbeDeps["micAccessStatus"]>>, inputs = 1) =>
    createBrowserSetupProbe(deps({ micAccessStatus: async () => status, audioInputs: async () => inputs })).probeMic(live());

  it("permiso concedido con dispositivo ⇒ granted", async () => {
    expect(await mic("granted", 2)).toEqual({ status: "granted", devices: 2 });
  });

  it("denegado o restringido ⇒ denied", async () => {
    expect((await mic("denied")).status).toBe("denied");
    expect((await mic("restricted")).status).toBe("denied");
  });

  it("sin dispositivos de entrada ⇒ no-device", async () => {
    expect(await mic("granted", 0)).toEqual({ status: "no-device", devices: 0 });
  });

  it("not-determined / unknown con dispositivo ⇒ unknown (no abre el micrófono)", async () => {
    expect((await mic("not-determined")).status).toBe("unknown");
    expect((await mic("unknown")).status).toBe("unknown");
  });

  it("si micAccessStatus o enumerateDevices fallan, no lanza", async () => {
    const r = await createBrowserSetupProbe(
      deps({ micAccessStatus: async () => { throw new Error("ipc"); }, audioInputs: async () => { throw new Error("dev"); } }),
    ).probeMic(live());
    expect(r).toEqual({ status: "unknown", devices: 0 });
  });

  it("abortada ⇒ timeout", async () => {
    const ctl = new AbortController();
    const pending = createBrowserSetupProbe(deps({ micAccessStatus: () => new Promise(() => {}) })).probeMic(ctl.signal);
    ctl.abort();
    await expect(pending).resolves.toEqual({ status: "timeout", devices: 0 });
  });
});
