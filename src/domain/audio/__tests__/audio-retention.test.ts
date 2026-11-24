import { describe, expect, it } from "vitest";
import type { LeitnerBox } from "@/domain/srs/leitner";
import type { AudioClipMeta } from "../audio-clip";
import { DEFAULT_AUDIO_CAP_BYTES, planRetention } from "../audio-retention";

const clip = (id: string, bytes: number, createdAt: number): AudioClipMeta => ({
  id, origin: "learner", text: id, durationMs: 1000, bytes, createdAt,
});

const sinCaja = () => undefined;

describe("planRetention", () => {
  it("el tope por defecto es de 500 MB", () => {
    expect(DEFAULT_AUDIO_CAP_BYTES).toBe(500 * 1024 * 1024);
  });

  it("cabe: el total más el entrante no supera el tope", () => {
    const plan = planRetention({ clips: [clip("a", 40, 1)], incomingBytes: 60, capBytes: 100, boxOfClip: sinCaja });
    expect(plan).toEqual({ kind: "fits" });
  });

  it("desaloja de caja 5 del más viejo al más nuevo hasta que quepa", () => {
    const clips = [clip("nuevo", 30, 30), clip("viejo", 30, 10), clip("medio", 30, 20)];
    const boxes: Record<string, LeitnerBox> = { nuevo: 5, viejo: 5, medio: 5 };
    // 90 + 30 = 120 > 100: con liberar "viejo" (30) queda 90 <= 100
    const plan = planRetention({ clips, incomingBytes: 30, capBytes: 100, boxOfClip: (id) => boxes[id] });
    expect(plan).toEqual({ kind: "evict", ids: ["viejo"] });
  });

  it("desaloja varios si uno solo no alcanza", () => {
    const clips = [clip("a", 50, 1), clip("b", 50, 2)];
    const plan = planRetention({ clips, incomingBytes: 80, capBytes: 100, boxOfClip: () => 5 });
    // 100 + 80 = 180: hay que liberar 80 => a y b
    expect(plan).toEqual({ kind: "evict", ids: ["a", "b"] });
  });

  it("nunca desaloja clips de cajas distintas de la 5", () => {
    const clips = [clip("a", 60, 1), clip("b", 40, 2)];
    const plan = planRetention({ clips, incomingBytes: 50, capBytes: 100, boxOfClip: () => 4 });
    expect(plan).toEqual({ kind: "reject" });
  });

  it("clips sin tarjeta (sin caja) no se desalojan", () => {
    const plan = planRetention({ clips: [clip("a", 100, 1)], incomingBytes: 10, capBytes: 100, boxOfClip: sinCaja });
    expect(plan).toEqual({ kind: "reject" });
  });

  it("rechaza (sin desalojo parcial) si ni desalojando todo lo de caja 5 alcanza", () => {
    const clips = [clip("a", 20, 1), clip("b", 80, 2)];
    const boxes: Record<string, LeitnerBox> = { a: 5 };
    const plan = planRetention({ clips, incomingBytes: 50, capBytes: 100, boxOfClip: (id) => boxes[id] });
    expect(plan).toEqual({ kind: "reject" });
  });

  it("rechaza un clip que por sí solo supera el tope", () => {
    const plan = planRetention({ clips: [], incomingBytes: 101, capBytes: 100, boxOfClip: sinCaja });
    expect(plan).toEqual({ kind: "reject" });
  });
});
