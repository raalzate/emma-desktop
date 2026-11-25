/**
 * Precálculo de la escena desde el mapa (T14 de #323): los hechos de la escena
 * recomendada se generan en segundo plano mientras el aprendiz mira el mapa, y
 * el chat los toma al abrirla en vez de esperar ~20 s detrás del botón.
 */
import { describe, expect, it, vi } from "vitest";
import { prefetchScene, takePrefetchedScene, clearPrefetch } from "../scene-prefetch";
import type { EmmaRuntime } from "@/interface/emma-runtime";

function fakeRuntime(result: Promise<{ facts: string; generated: boolean }>) {
  const sceneFacts = vi.fn(() => result);
  return { runtime: { sceneFacts } as unknown as EmmaRuntime, sceneFacts };
}

describe("scene-prefetch", () => {
  it("genera los hechos en segundo plano y el chat los toma una sola vez", async () => {
    clearPrefetch();
    const { runtime, sceneFacts } = fakeRuntime(Promise.resolve({ facts: "Atlas API, sprint 14", generated: true }));
    prefetchScene(runtime, { scenarioType: "daily_standup", level: "A1" });
    expect(sceneFacts).toHaveBeenCalledWith(expect.objectContaining({ priority: "background" }));
    const taken = takePrefetchedScene("daily_standup");
    expect(taken?.situation.scenarioType).toBe("daily_standup");
    expect(await taken?.facts).toEqual({ facts: "Atlas API, sprint 14", generated: true });
    expect(takePrefetchedScene("daily_standup")).toBeUndefined();
  });

  it("no duplica el precálculo de la misma escena", () => {
    clearPrefetch();
    const { runtime, sceneFacts } = fakeRuntime(new Promise(() => {}));
    prefetchScene(runtime, { scenarioType: "daily_standup", level: "A1" });
    prefetchScene(runtime, { scenarioType: "daily_standup", level: "A1" });
    expect(sceneFacts).toHaveBeenCalledTimes(1);
  });

  it("un precálculo vencido no se usa", () => {
    clearPrefetch();
    const { runtime } = fakeRuntime(new Promise(() => {}));
    prefetchScene(runtime, { scenarioType: "daily_standup", level: "A1" }, 1_000);
    expect(takePrefetchedScene("daily_standup", 1_000 + 31 * 60_000)).toBeUndefined();
  });

  it("si la generación falla (preemptada), resuelve null para que el chat genere de nuevo", async () => {
    clearPrefetch();
    const { runtime } = fakeRuntime(Promise.reject(new Error("Generation aborted")));
    prefetchScene(runtime, { scenarioType: "daily_standup", level: "A1" });
    expect(await takePrefetchedScene("daily_standup")?.facts).toBeNull();
  });

  it("un escenario desconocido no precalcula nada", () => {
    clearPrefetch();
    const { runtime, sceneFacts } = fakeRuntime(Promise.resolve({ facts: "x", generated: true }));
    prefetchScene(runtime, { scenarioType: "no_existe", level: "A1" });
    expect(sceneFacts).not.toHaveBeenCalled();
  });
});
