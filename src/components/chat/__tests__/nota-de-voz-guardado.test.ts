/**
 * T27 — guardado de la nota de voz del aprendiz: formato de grabación, puente
 * hacia `runtime.audio.saveLearnerTurn` y reparto del `audioId` en el turno.
 * Todo con fakes inyectados; MediaRecorder real se verifica por CDP.
 */

import { describe, expect, it } from "vitest";
import type { ChatTurn } from "@/domain/chat/simulation-session";
import {
  attachAudioId,
  clipsByTurn,
  recorderOptionsFor,
  saveVoiceTurn,
  VOICE_BITRATE,
  VOICE_MIME,
  type VoiceTurnSaver,
} from "../voice-turn";

type SaveArgs = Parameters<VoiceTurnSaver["saveLearnerTurn"]>[0];

function fakeAudio(result: string | null | Error = "clip-1") {
  const calls: SaveArgs[] = [];
  const audio: VoiceTurnSaver = {
    saveLearnerTurn: async (a) => {
      calls.push(a);
      if (result instanceof Error) throw result;
      return result;
    },
  };
  return { audio, calls };
}

const clip = { blob: new Blob([new Uint8Array([1, 2, 3])]), durationMs: 2400 };

describe("recorderOptionsFor", () => {
  it("pide Opus/WebM a 32 kbps cuando el navegador lo soporta", () => {
    expect(recorderOptionsFor(() => true)).toEqual({ mimeType: VOICE_MIME, audioBitsPerSecond: VOICE_BITRATE });
    expect(VOICE_MIME).toBe("audio/webm;codecs=opus");
    expect(VOICE_BITRATE).toBe(32_000);
  });

  it("cae al formato por defecto si el mime no está soportado", () => {
    expect(recorderOptionsFor(() => false)).toEqual({ audioBitsPerSecond: VOICE_BITRATE });
  });
});

describe("saveVoiceTurn", () => {
  it("guarda blob y duración y devuelve el id del clip", async () => {
    const { audio, calls } = fakeAudio("abc");
    const id = await saveVoiceTurn({ audio, conversationId: "c1", turn: 3, transcript: " hello ", clip });
    expect(id).toBe("abc");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ conversationId: "c1", turn: 3, transcript: "hello", durationMs: 2400 });
    expect(Array.from(calls[0].data)).toEqual([1, 2, 3]);
  });

  it("una transcripción vacía no guarda nada", async () => {
    const { audio, calls } = fakeAudio();
    expect(await saveVoiceTurn({ audio, conversationId: "c1", turn: 1, transcript: "  ", clip })).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("un turno escrito (sin clip) no guarda nada", async () => {
    const { audio, calls } = fakeAudio();
    expect(await saveVoiceTurn({ audio, conversationId: "c1", turn: 1, transcript: "hi", clip: undefined })).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("si el guardado falla, devuelve null y no rompe el turno", async () => {
    const { audio } = fakeAudio(new Error("disco lleno"));
    expect(await saveVoiceTurn({ audio, conversationId: "c1", turn: 1, transcript: "hi", clip })).toBeNull();
  });

  it("avisa del error por onError", async () => {
    const { audio } = fakeAudio(new Error("disco lleno"));
    const errores: unknown[] = [];
    await saveVoiceTurn({ audio, conversationId: "c1", turn: 1, transcript: "hi", clip, onError: (e) => errores.push(e) });
    expect(errores).toHaveLength(1);
  });
});

describe("attachAudioId", () => {
  const a: ChatTurn = { role: "user", content: "one", at: 1 };
  const b: ChatTurn = { role: "user", content: "two", at: 2 };

  it("marca sólo el mensaje indicado", () => {
    const out = attachAudioId([a, b], b, "clip-9");
    expect(out[0]).toBe(a);
    expect(out[1]).toEqual({ ...b, audioId: "clip-9" });
  });

  it("si el mensaje ya no está, deja la lista igual", () => {
    const out = attachAudioId([a], b, "x");
    expect(out).toEqual([a]);
  });
});

describe("clipsByTurn", () => {
  it("reconstruye turno → clip desde los mensajes del aprendiz al reanudar", () => {
    const msgs: ChatTurn[] = [
      { role: "assistant", content: "hi", at: 0 },
      { role: "user", content: "one", at: 1, audioId: "a" },
      { role: "assistant", content: "ok", at: 2 },
      { role: "user", content: "two", at: 3 },
      { role: "user", content: "three", at: 4, audioId: "c" },
    ];
    expect(clipsByTurn(msgs)).toEqual({ 1: "a", 3: "c" });
  });
});
