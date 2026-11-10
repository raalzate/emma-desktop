/**
 * T29 — frases de EMMA al cerrar el diálogo de lección: qué se captura y el
 * trabajo en segundo plano (serie, cancelable, no compite con la lección).
 */

import { describe, expect, it } from "vitest";
import { scenariosForLevel } from "@/domain/scenarios/scenario-catalog";
import type { SilentError } from "@/domain/chat/simulation-session";
import { createPhraseCaptureJob } from "../phrase-capture-job";
import { phrasesOfSession } from "../use-finish-session";

const scenario = scenariosForLevel("B1")[0];
const err = (corrected: string): SilentError => ({ label: "grammar", original: "I go home yesterday", corrected, turn: 2 });

describe("phrasesOfSession", () => {
  it("incluye la corrección reportable como frase a guardar", () => {
    const out = phrasesOfSession({ scenario, situation: null, errors: [err("I went home yesterday")] });
    expect(out).toContainEqual({ text: "I went home yesterday", source: "correction" });
  });

  it("sin errores no inventa frases de corrección", () => {
    const out = phrasesOfSession({ scenario, situation: null, errors: [] });
    expect(out.filter((p) => p.source === "correction")).toEqual([]);
  });
});

describe("createPhraseCaptureJob", () => {
  const pendiente = () => {
    let resolver!: () => void;
    const promesa = new Promise<void>((r) => (resolver = r));
    return { promesa, resolver };
  };

  it("sin frases no arranca nada", () => {
    const job = createPhraseCaptureJob();
    let corridas = 0;
    job.start([], async () => void corridas++);
    expect(corridas).toBe(0);
  });

  it("arranca con una señal viva y termina libre", async () => {
    const job = createPhraseCaptureJob();
    let signal: AbortSignal | undefined;
    await job.start([{ text: "Hi.", source: "scene" }], async (s) => void (signal = s));
    expect(signal?.aborted).toBe(false);
    expect(job.running()).toBe(false);
  });

  it("cancel aborta la captura en curso (se abre otra lección)", () => {
    const job = createPhraseCaptureJob();
    const { promesa } = pendiente();
    let signal: AbortSignal | undefined;
    void job.start([{ text: "Hi.", source: "scene" }], (s) => ((signal = s), promesa));
    expect(job.running()).toBe(true);
    job.cancel();
    expect(signal?.aborted).toBe(true);
    expect(job.running()).toBe(false);
  });

  it("una captura nueva aborta la anterior: nunca dos a la vez", () => {
    const job = createPhraseCaptureJob();
    const signals: AbortSignal[] = [];
    const run = (s: AbortSignal) => (signals.push(s), pendiente().promesa);
    void job.start([{ text: "A.", source: "scene" }], run);
    void job.start([{ text: "B.", source: "scene" }], run);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it("un fallo se reporta por onError y no rechaza", async () => {
    const errores: unknown[] = [];
    const job = createPhraseCaptureJob((e) => errores.push(e));
    await job.start([{ text: "Hi.", source: "scene" }], async () => {
      throw new Error("kokoro cayó");
    });
    expect(errores).toHaveLength(1);
    expect(job.running()).toBe(false);
  });
});
