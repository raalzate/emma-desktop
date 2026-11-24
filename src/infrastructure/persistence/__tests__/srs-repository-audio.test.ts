/**
 * Retrocompatibilidad del repo SRS con la tarjeta audio-recall (FR-007, SC-007).
 * Mismo fake de window.emmaAPI que srs-repository.test.ts.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { EmmaApi } from "@/types/emma-api";
import type { SrsCard } from "@/domain/srs/srs-card";
import { createSrsRepository } from "../srs-repository";

function installApi(initial: Record<string, unknown> = {}): void {
  const memory: Record<string, unknown> = { ...initial };
  const api = {
    storeGet: async (key: string) => (memory[key] as Record<string, unknown>) ?? {},
    storeSet: async (key: string, value: Record<string, unknown>) => {
      memory[key] = value;
      return { ok: true };
    },
  } as unknown as EmmaApi;
  Object.defineProperty(globalThis, "window", { value: { emmaAPI: api }, writable: true, configurable: true });
}

const audioCard: SrsCard = {
  id: "audio-emma-1",
  kind: "audio-recall",
  box: 1,
  lastReviewedDay: 3,
  front: "Listen and type what you hear.",
  back: "The deploy failed.",
  audioId: "emma-1",
  audioOrigin: "emma",
};

const viejas: SrsCard[] = (
  ["chunk-cloze", "sentence-production", "minimal-pair", "word-stress", "collocation"] as const
).map((kind, i) => ({ id: `v${i}`, kind, box: 2, lastReviewedDay: i, front: "f", back: "b", sourceEs: "es" }));

describe("repo SRS con audio-recall", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", { value: undefined, writable: true, configurable: true });
  });

  it("guarda y recupera una tarjeta audio-recall con audioId y audioOrigin", async () => {
    installApi();
    const repo = createSrsRepository();
    await repo.saveCards([audioCard]);
    expect(await repo.loadCards()).toEqual([audioCard]);
  });

  it("un store viejo de los 5 kinds carga idéntico", async () => {
    installApi({ srs: { default: viejas } });
    expect(await createSrsRepository().loadCards()).toEqual(viejas);
  });

  it("una tarjeta de producción con la voz del aprendiz adjunta conserva su audioId", async () => {
    const conVoz: SrsCard = { ...viejas[1], audioId: "learner-c-2", audioOrigin: "learner" };
    installApi({ srs: { default: [conVoz] } });
    expect(await createSrsRepository().loadCards()).toEqual([conVoz]);
  });

  it("un audioId que no es texto se descarta pero la tarjeta se conserva (degrada a texto)", async () => {
    installApi({ srs: { default: [{ ...audioCard, audioId: 42, audioOrigin: "otro" }] } });
    const [card] = await createSrsRepository().loadCards();
    expect(card.id).toBe("audio-emma-1");
    expect("audioId" in card).toBe(false);
    expect("audioOrigin" in card).toBe(false);
  });

  it("sigue descartando kinds desconocidos", async () => {
    installApi({ srs: { default: [audioCard, { ...audioCard, id: "x", kind: "video-recall" }] } });
    expect(await createSrsRepository().loadCards()).toEqual([audioCard]);
  });
});
