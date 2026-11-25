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

describe("conversación lenta (T18 de #323)", () => {
  it("con 3 turnos y mediana sobre el umbral, la conversación es lenta", async () => {
    const { isSlowConversation, SLOW_TURN_MS } = await import("../live-failure");
    expect(isSlowConversation([SLOW_TURN_MS + 1, SLOW_TURN_MS + 500, 2000])).toBe(true);
    expect(isSlowConversation([SLOW_TURN_MS + 1, 3000, 2000])).toBe(false);
    expect(isSlowConversation([SLOW_TURN_MS * 2, SLOW_TURN_MS * 2])).toBe(false);
  });

  it("mira sólo los últimos 3 turnos", async () => {
    const { isSlowConversation, SLOW_TURN_MS } = await import("../live-failure");
    expect(isSlowConversation([SLOW_TURN_MS * 3, SLOW_TURN_MS * 3, 1000, 1000, 1000])).toBe(false);
  });

  it("sugiere usar la nube: la causa es la IA local lenta", async () => {
    const { causeOfLiveFailure } = await import("../live-failure");
    expect(causeOfLiveFailure({ kind: "ai-slow" })).toBe("ai-slow-local");
  });
});
