/**
 * Pruebas del adaptador de autoevaluación sobre store-client. Mismo enfoque que
 * srs-repository.test.ts: se simula window.emmaAPI con un fake en memoria.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { EmmaApi } from "@/types/emma-api";
import { createSelfAssessmentRepository } from "../self-assessment-repository";

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

describe("createSelfAssessmentRepository", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("devuelve arreglo vacío cuando no hay ids guardados", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createSelfAssessmentRepository();
    const ids = await repo.loadChecked();

    expect(ids).toEqual([]);
  });

  it("guarda y recupera los ids marcados", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createSelfAssessmentRepository();
    await repo.saveChecked(["A1-1", "B2-3"]);
    const ids = await repo.loadChecked();

    expect(ids).toEqual(["A1-1", "B2-3"]);
  });

  it("descarta entradas que no sean strings (guard clause)", async () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        emmaAPI: createFakeApi({
          selfAssessment: { default: ["A1-1", 42, null, "B2-3"] },
        }),
      },
      writable: true,
      configurable: true,
    });

    const repo = createSelfAssessmentRepository();
    const ids = await repo.loadChecked();

    expect(ids).toEqual(["A1-1", "B2-3"]);
  });

  it("devuelve arreglo vacío fuera de Electron (sin window)", async () => {
    const repo = createSelfAssessmentRepository();
    const ids = await repo.loadChecked();

    expect(ids).toEqual([]);
  });
});
