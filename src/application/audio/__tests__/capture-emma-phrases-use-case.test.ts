import { describe, it, expect } from "vitest";
import { captureEmmaPhrases } from "../capture-emma-phrases-use-case";
import { audioRecallCardId } from "@/domain/srs/srs-card";
import { emmaClipId } from "@/domain/audio/audio-clip";
import { createFakeSrs, createFakeStore, createFakeVoicer } from "./fakes";
import type { PhraseToKeep } from "@/domain/audio/scene-phrases";

const frase = (text: string, source: PhraseToKeep["source"] = "scene"): PhraseToKeep => ({ text, source });

const base = () => ({
  store: createFakeStore(),
  srs: createFakeSrs(),
  voicer: createFakeVoicer(),
  voiceKey: "af_heart",
  conversationId: "conv-1",
  now: 500,
  today: 3,
  capBytes: 100_000,
  signal: new AbortController().signal,
});

describe("captureEmmaPhrases", () => {
  it("sintetiza, guarda y crea una tarjeta por frase (FR-003, FR-008)", async () => {
    const args = base();
    const res = await captureEmmaPhrases({ ...args, phrases: [frase("Good morning, how can I help?"), frase("Could you repeat that?", "correction")] });

    expect(res).toEqual({ saved: 2, deduped: 0, failed: 0 });
    const id = emmaClipId("Good morning, how can I help?", "af_heart");
    expect((await args.store.load(id))?.meta).toMatchObject({
      origin: "emma",
      voice: "af_heart",
      conversationId: "conv-1",
      text: "Good morning, how can I help?",
    });
    expect(args.srs.cards.map((c) => c.id)).toContain(audioRecallCardId(id));
    expect(args.srs.cards).toHaveLength(2);
  });

  it("dedupe: la misma frase y voz no se sintetiza ni se guarda dos veces", async () => {
    const args = base();
    const phrases = [frase("See you soon"), frase("  see   you SOON ")];
    await captureEmmaPhrases({ ...args, phrases });
    const res = await captureEmmaPhrases({ ...args, phrases });

    expect(args.voicer.calls).toHaveLength(1);
    expect(args.store.saves).toBe(1);
    expect(args.srs.cards).toHaveLength(1);
    expect(res.saved).toBe(0);
    expect(res.deduped).toBe(2);
  });

  it("dedupe asegura la tarjeta si el clip ya estaba pero la tarjeta no", async () => {
    const args = base();
    await captureEmmaPhrases({ ...args, phrases: [frase("See you soon")] });
    args.srs.cards.length = 0;
    await captureEmmaPhrases({ ...args, phrases: [frase("See you soon")] });
    expect(args.srs.cards).toHaveLength(1);
  });

  it("es secuencial: no empieza una frase hasta terminar la anterior", async () => {
    const args = base();
    let activas = 0;
    let maxActivas = 0;
    const voicer = {
      async voice() {
        activas += 1;
        maxActivas = Math.max(maxActivas, activas);
        await new Promise((r) => setTimeout(r, 2));
        activas -= 1;
        return { data: new Uint8Array(10).fill(1), durationMs: 1000 };
      },
    };
    await captureEmmaPhrases({ ...args, voicer, phrases: [frase("one"), frase("two"), frase("three")] });
    expect(maxActivas).toBe(1);
  });

  it("abortable: con la señal abortada no sintetiza más frases", async () => {
    const args = base();
    const ctl = new AbortController();
    const voicer = {
      async voice(text: string) {
        if (text === "first") ctl.abort();
        return { data: new Uint8Array(10).fill(1), durationMs: 1000 };
      },
    };
    await captureEmmaPhrases({ ...args, voicer, signal: ctl.signal, phrases: [frase("first"), frase("second")] });
    expect(args.store.clips.size).toBeLessThanOrEqual(1);
    expect(args.srs.cards.length).toBeLessThanOrEqual(1);
  });

  it("un voicer que falla o devuelve null no corta las demás; la tarjeta se crea igual (FR-006)", async () => {
    const args = base();
    const voicer = createFakeVoicer((t) => (t === "boom" ? "throw" : t === "none" ? "null" : "ok"));
    const errores: unknown[] = [];
    const res = await captureEmmaPhrases({
      ...args,
      voicer,
      onError: (e) => errores.push(e),
      phrases: [frase("boom"), frase("none"), frase("fine")],
    });

    expect(res).toEqual({ saved: 1, deduped: 0, failed: 2 });
    expect(errores).toHaveLength(1);
    expect(args.store.clips.size).toBe(1);
    expect(args.srs.cards).toHaveLength(3);
  });

  it("almacén que lanza: no lanza y la tarjeta se crea igual", async () => {
    const args = { ...base(), store: createFakeStore({ failSave: true }) };
    const res = await captureEmmaPhrases({ ...args, phrases: [frase("hello")] });
    expect(res.failed).toBe(1);
    expect(args.srs.cards).toHaveLength(1);
  });
});
