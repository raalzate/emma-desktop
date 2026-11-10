import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkAiReadiness } from "../ai-readiness";
import { loadAiSettings, saveAiSettings, type AiRemoteSettings } from "../remote-settings";

// La puerta de IA (`AiGate`) sólo deja entrar a la app cuando esto dice `ready`.
// Se prueba con un localStorage en memoria y un puente `emmaAPI` falso.

interface FakeModel {
  id: string;
  downloaded: boolean;
}

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

function stubBridge(models: FakeModel[], keys: Record<string, boolean>) {
  vi.stubGlobal("window", {
    emmaAPI: {
      litertModelsList: async () => ({ totalRamGB: 16, models }),
      getAiKeyStatus: async () => keys,
    },
  });
}

function settings(mode: AiRemoteSettings["mode"]): AiRemoteSettings {
  return { mode, provider: "anthropic", models: {} };
}

const GEMMA_E4B: FakeModel = { id: "gemma-e4b", downloaded: true };

describe("checkAiReadiness", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("modo remoto sin llave pero con Gemma descargado: vuelve a local y deja pasar", async () => {
    saveAiSettings(settings("remote"));
    stubBridge([GEMMA_E4B], {});

    const r = await checkAiReadiness();

    expect(r).toEqual({ ready: true, mode: "local", reason: "ok" });
    expect(loadAiSettings().mode).toBe("local");
  });

  it("modo remoto con llave del proveedor: lista en la nube, sin tocar el modo", async () => {
    saveAiSettings(settings("remote"));
    stubBridge([GEMMA_E4B], { anthropic: true });

    const r = await checkAiReadiness();

    expect(r).toEqual({ ready: true, mode: "remote", reason: "ok" });
    expect(loadAiSettings().mode).toBe("remote");
  });

  it("modo remoto sin llave ni modelo local: no lista por falta de llave", async () => {
    saveAiSettings(settings("remote"));
    stubBridge([{ id: "gemma-e4b", downloaded: false }], {});

    const r = await checkAiReadiness();

    expect(r).toEqual({ ready: false, mode: "remote", reason: "no-remote-key" });
    expect(loadAiSettings().mode).toBe("remote");
  });

  it("modo local con un modelo descargado: lista", async () => {
    saveAiSettings(settings("local"));
    stubBridge([GEMMA_E4B], {});

    expect(await checkAiReadiness()).toEqual({ ready: true, mode: "local", reason: "ok" });
  });

  it("modo local sin modelos: pide descargar uno", async () => {
    saveAiSettings(settings("local"));
    stubBridge([{ id: "gemma-e4b", downloaded: false }], {});

    expect(await checkAiReadiness()).toEqual({ ready: false, mode: "local", reason: "no-model" });
  });

  it("sin puente de Electron: no lista", async () => {
    vi.stubGlobal("window", {});

    expect(await checkAiReadiness()).toEqual({ ready: false, mode: "local", reason: "no-bridge" });
  });
});
