/** T28 — las reglas puras del transcodificador (el MediaRecorder real va por CDP). */

import { describe, expect, it } from "vitest";
import { cappedDurationMs, stopAfterMs } from "../wav-to-opus";
import { VOICE_BITRATE, VOICE_MIME, recorderOptionsFor } from "../clip-recorder-options";

describe("wav-to-opus", () => {
  it("la duración se mide en ms y topa a 60 s", () => {
    expect(cappedDurationMs(2.4)).toBe(2400);
    expect(cappedDurationMs(90)).toBe(60_000);
  });

  it("un audio corto se corta con holgura; uno largo, exactamente al tope", () => {
    expect(stopAfterMs(3)).toBe(8_000);
    expect(stopAfterMs(75)).toBe(60_000);
  });

  it("graba como Opus/WebM a 32 kbps", () => {
    expect(recorderOptionsFor(() => true)).toEqual({ mimeType: VOICE_MIME, audioBitsPerSecond: VOICE_BITRATE });
  });
});
