import { describe, expect, it } from "vitest";
import { createIssueHandler } from "@/components/setup/setup-issue-handler";
import { causeOfLiveFailure } from "@/domain/setup/live-failure";

describe("createIssueHandler", () => {
  it("sugiere una vez y calla las siguientes dentro de 10 minutos", () => {
    let now = 1_000;
    const sugeridos: string[] = [];
    const handle = createIssueHandler({ now: () => now, suggest: (c) => sugeridos.push(c) });
    handle({ kind: "voice-fallback" });
    now += 60_000;
    handle({ kind: "ai-error" });
    expect(sugeridos).toEqual([causeOfLiveFailure({ kind: "voice-fallback" })]);
  });

  it("vuelve a sugerir pasados los 10 minutos", () => {
    let now = 0;
    const sugeridos: string[] = [];
    const handle = createIssueHandler({ now: () => now, suggest: (c) => sugeridos.push(c) });
    handle({ kind: "ai-timeout" });
    now = 10 * 60 * 1000;
    handle({ kind: "ai-timeout" });
    expect(sugeridos).toHaveLength(2);
  });

  it("un fallo al sugerir no se propaga al turno", () => {
    const handle = createIssueHandler({ now: () => 0, suggest: () => { throw new Error("toast roto"); } });
    expect(() => handle({ kind: "ai-error" })).not.toThrow();
  });
});

import { probeOfCause, settingsUrlFor } from "@/components/setup/setup-issue-handler";

describe("probeOfCause / settingsUrlFor", () => {
  it("cada causa apunta a su sonda", () => {
    expect(probeOfCause("voice-fallback")).toBe("voice");
    expect(probeOfCause("ai-timeout")).toBe("ai");
    expect(probeOfCause("no-webgpu")).toBe("ai");
    expect(probeOfCause("mic-denied")).toBe("mic");
  });
  it("la URL abre la pestaña de audio con la sonda a enfocar", () => {
    expect(settingsUrlFor("ai-timeout")).toBe("/settings/?tab=audio&focus=ai");
    expect(settingsUrlFor("voice-fallback")).toBe("/settings/?tab=audio&focus=voice");
  });
});
