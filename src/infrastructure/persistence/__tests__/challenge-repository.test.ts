/**
 * Pruebas del adaptador de retos sobre store-client, con el mismo fake en
 * memoria de window.emmaAPI usado en srs-repository.test.ts.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { EmmaApi } from "@/types/emma-api";
import { createChallengeRepository } from "../challenge-repository";

function createFakeApi(initial: Record<string, unknown> = {}): EmmaApi {
  const memory: Record<string, unknown> = { ...initial };
  return {
    storeGet: async (key: string) => (memory[key] as Record<string, unknown>) ?? {},
    storeSet: async (key: string, value: Record<string, unknown>) => {
      memory[key] = value;
      return { ok: true };
    },
  } as unknown as EmmaApi;
}

describe("createChallengeRepository", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("devuelve arreglo vacío de completados cuando no hay datos guardados", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createChallengeRepository();
    expect(await repo.loadCompleted()).toEqual([]);
  });

  it("marca un reto como completado y lo recupera", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createChallengeRepository();
    await repo.markCompleted(3);
    await repo.markCompleted(5);

    expect(await repo.loadCompleted()).toEqual([3, 5]);
  });

  it("no duplica un reto ya marcado como completado", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createChallengeRepository();
    await repo.markCompleted(3);
    await repo.markCompleted(3);

    expect(await repo.loadCompleted()).toEqual([3]);
  });

  it("guarda y recupera la entrega de texto de un reto", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createChallengeRepository();
    await repo.saveSubmission(1, "Hi, I'm a backend developer.");
    const submissions = await repo.loadSubmissions();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].challengeId).toBe(1);
    expect(submissions[0].text).toBe("Hi, I'm a backend developer.");
    expect(typeof submissions[0].submittedAt).toBe("string");
  });

  it("reemplaza la entrega anterior del mismo reto", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createChallengeRepository();
    await repo.saveSubmission(1, "primera versión");
    await repo.saveSubmission(1, "versión final");
    const submissions = await repo.loadSubmissions();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].text).toBe("versión final");
  });

  it("descarta datos corruptos al cargar (guard clause)", async () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        emmaAPI: createFakeApi({
          challenges: { default: { completed: "no-es-arreglo", submissions: "tampoco" } },
        }),
      },
      writable: true,
      configurable: true,
    });

    const repo = createChallengeRepository();
    expect(await repo.loadCompleted()).toEqual([]);
    expect(await repo.loadSubmissions()).toEqual([]);
  });

  it("devuelve valores vacíos fuera de Electron (sin window)", async () => {
    const repo = createChallengeRepository();
    expect(await repo.loadCompleted()).toEqual([]);
    expect(await repo.loadSubmissions()).toEqual([]);
  });
});
