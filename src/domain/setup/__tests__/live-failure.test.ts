import { describe, it, expect } from "vitest";
import { causeOfLiveFailure, shouldSuggestCheck, type LiveFailure } from "../live-failure";

describe("causeOfLiveFailure", () => {
  it.each([
    [{ kind: "voice-fallback" }, "voice-fallback"],
    [{ kind: "ai-error" }, "ai-no-response"],
    [{ kind: "ai-timeout" }, "ai-timeout"],
  ] as const)("%j ⇒ %s", (f: LiveFailure, causa) => {
    expect(causeOfLiveFailure(f)).toBe(causa);
  });
});

describe("shouldSuggestCheck", () => {
  const MIN10 = 10 * 60 * 1000;
  it("sugiere si nunca se sugirió", () => {
    expect(shouldSuggestCheck({ now: 5 })).toBe(true);
  });
  it("no vuelve a sugerir antes de 10 minutos", () => {
    expect(shouldSuggestCheck({ lastSuggestedAt: 1000, now: 1000 + MIN10 - 1 })).toBe(false);
  });
  it("vuelve a sugerir a los 10 minutos exactos", () => {
    expect(shouldSuggestCheck({ lastSuggestedAt: 1000, now: 1000 + MIN10 })).toBe(true);
  });
  it("un reloj que retrocede no spamea", () => {
    expect(shouldSuggestCheck({ lastSuggestedAt: 5000, now: 1000 })).toBe(false);
  });
});
