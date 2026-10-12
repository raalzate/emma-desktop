import { describe, it, expect } from "vitest";
import { parseWorkerRequest, parseWorkerResponse } from "../kokoro-protocol";

describe("parseWorkerRequest", () => {
  it("acepta load y generate bien formados", () => {
    expect(parseWorkerRequest({ type: "load", id: 1 })).toEqual({ type: "load", id: 1 });
    expect(parseWorkerRequest({ type: "generate", id: 2, text: "hi", voice: "af_heart" })).toEqual({
      type: "generate",
      id: 2,
      text: "hi",
      voice: "af_heart",
    });
  });

  it("rechaza lo que no es del protocolo", () => {
    expect(parseWorkerRequest(null)).toBeNull();
    expect(parseWorkerRequest("load")).toBeNull();
    expect(parseWorkerRequest({ type: "nuke", id: 1 })).toBeNull();
    expect(parseWorkerRequest({ type: "generate", id: 1, text: "", voice: "af_heart" })).toBeNull();
    expect(parseWorkerRequest({ type: "generate", id: "1", text: "hi", voice: "af_heart" })).toBeNull();
    expect(parseWorkerRequest({ type: "generate", id: 1, text: "hi" })).toBeNull();
  });
});

describe("parseWorkerResponse", () => {
  it("acepta ready, audio y error", () => {
    const blob = new Blob(["wav"]);
    expect(parseWorkerResponse({ type: "ready", id: 1 })).toEqual({ type: "ready", id: 1 });
    expect(parseWorkerResponse({ type: "audio", id: 2, blob, duration: 1.5 })).toEqual({
      type: "audio",
      id: 2,
      blob,
      duration: 1.5,
    });
    expect(parseWorkerResponse({ type: "error", id: 3, message: "boom" })).toEqual({
      type: "error",
      id: 3,
      message: "boom",
    });
  });

  it("rechaza audio sin Blob o con duración inválida", () => {
    expect(parseWorkerResponse({ type: "audio", id: 1, blob: "x", duration: 1 })).toBeNull();
    expect(parseWorkerResponse({ type: "audio", id: 1, blob: new Blob([]), duration: 0 })).toBeNull();
    expect(parseWorkerResponse({ type: "audio", id: 1, blob: new Blob([]), duration: NaN })).toBeNull();
    expect(parseWorkerResponse(undefined)).toBeNull();
  });
});
