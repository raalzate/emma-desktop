/**
 * Pruebas del adaptador SRS sobre store-client. Como no hay Electron real,
 * se simula window.emmaAPI con un fake en memoria (mismo enfoque que usarían
 * los demás repos de esta carpeta).
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { EmmaApi } from "@/types/emma-api";
import type { SrsCard } from "@/domain/srs/srs-card";
import { createSrsRepository } from "../srs-repository";

/** Fake mínimo de window.emmaAPI: solo storeGet/storeSet, respaldados en memoria. */
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

const sampleCard: SrsCard = {
  id: "c1",
  kind: "chunk-cloze",
  box: 1,
  lastReviewedDay: 0,
  front: "___ trabajo",
  back: "voy al trabajo",
};

describe("createSrsRepository", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("devuelve arreglo vacío cuando no hay tarjetas guardadas", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createSrsRepository();
    const cards = await repo.loadCards();

    expect(cards).toEqual([]);
  });

  it("guarda y recupera las tarjetas del usuario local", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createSrsRepository();
    await repo.saveCards([sampleCard]);
    const cards = await repo.loadCards();

    expect(cards).toEqual([sampleCard]);
  });

  it("descarta entradas corruptas al cargar (guard clause)", async () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        emmaAPI: createFakeApi({
          srs: { default: [sampleCard, { id: "bad" }, "no-es-un-objeto"] },
        }),
      },
      writable: true,
      configurable: true,
    });

    const repo = createSrsRepository();
    const cards = await repo.loadCards();

    expect(cards).toEqual([sampleCard]);
  });

  it("devuelve arreglo vacío fuera de Electron (sin window)", async () => {
    const repo = createSrsRepository();
    const cards = await repo.loadCards();

    expect(cards).toEqual([]);
  });
});
