/**
 * T28 — la voz de EMMA como clip guardable: sintetiza con Kokoro (WAV) y lo
 * transcodifica a Opus. Con dependencias falsas; el transcodificador real
 * (MediaRecorder) se verifica en la app por CDP.
 */

import { describe, expect, it } from "vitest";
import { createKokoroPhraseVoicer, type PhraseVoicerDeps } from "../kokoro-phrase-voicer";

const WAV = new Blob([new Uint8Array([82, 73, 70, 70])]);

function armar(over: Partial<PhraseVoicerDeps> = {}) {
  const llamadas = { synth: [] as Array<[string, string]>, revocadas: [] as string[], wavs: [] as Blob[] };
  const deps: PhraseVoicerDeps = {
    synthesize: async (text, voice) => {
      llamadas.synth.push([text, voice]);
      return { audioUrl: "blob:wav-1" };
    },
    fetchBlob: async () => WAV,
    toOpus: async (wav) => {
      llamadas.wavs.push(wav);
      return { data: new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]), durationMs: 2100 };
    },
    revoke: (url) => llamadas.revocadas.push(url),
    ...over,
  };
  return { voicer: createKokoroPhraseVoicer(deps), llamadas };
}

describe("createKokoroPhraseVoicer", () => {
  it("sintetiza con la voz pedida, transcodifica y devuelve el clip", async () => {
    const { voicer, llamadas } = armar();
    const out = await voicer.voice("Hello there.", "en-US-EmmaNeural");
    expect(llamadas.synth).toEqual([["Hello there.", "en-US-EmmaNeural"]]);
    expect(llamadas.wavs[0]).toBe(WAV);
    expect(out).toEqual({ data: new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]), durationMs: 2100 });
  });

  it("libera la URL temporal del WAV, salga bien o mal", async () => {
    const ok = armar();
    await ok.voicer.voice("Hi.", "v");
    expect(ok.llamadas.revocadas).toEqual(["blob:wav-1"]);

    const mal = armar({ toOpus: async () => { throw new Error("sin MediaRecorder"); } });
    await mal.voicer.voice("Hi.", "v");
    expect(mal.llamadas.revocadas).toEqual(["blob:wav-1"]);
  });

  it("si la cadena cae a Web Speech (rechaza), no hay clip: null", async () => {
    const { voicer, llamadas } = armar({
      synthesize: async () => { throw new Error("Sin voz neuronal disponible"); },
    });
    expect(await voicer.voice("Hi.", "v")).toBeNull();
    expect(llamadas.revocadas).toEqual([]);
  });

  it("si la transcodificación falla devuelve null y avisa por onError", async () => {
    const errores: unknown[] = [];
    const { voicer } = armar({
      toOpus: async () => { throw new Error("boom"); },
      onError: (e) => errores.push(e),
    });
    expect(await voicer.voice("Hi.", "v")).toBeNull();
    expect(errores).toHaveLength(1);
  });

  it("un resultado sin bytes no es un clip", async () => {
    const { voicer } = armar({ toOpus: async () => ({ data: new Uint8Array(0), durationMs: 0 }) });
    expect(await voicer.voice("Hi.", "v")).toBeNull();
  });
});
