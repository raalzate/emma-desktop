import { describe, expect, it, vi } from "vitest";
import { createEmmaRuntime } from "../emma-runtime";
import type { Repositories } from "../di/repositories";
import type { SrsCard } from "@/domain/srs/srs-card";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SilentError } from "@/domain/chat/silent-error";
import { classifyError } from "@/domain/chat/error-taxonomy";
import type { ISetupProbe } from "@/domain/setup/i-setup-probe";
import type { ISetupCheckRepository } from "@/domain/setup/i-setup-check-repository";
import { CHAT_FALLBACK } from "@/application/chat/run-chat-turn-use-case";
import { SETUP_ISSUE } from "../live-failure-bus";

/** Repos mínimos: sólo lo que el cierre de sesión toca; el resto no se usa. */
function fakeRepos() {
  const cards: SrsCard[] = [];
  const setupRecords: unknown[] = [];
  const repos = {
    srs: { loadCards: async () => cards, saveCards: async (c: SrsCard[]) => void cards.splice(0, cards.length, ...c) },
    errorStats: { record: async () => {}, getRecentStats: async () => [] },
    setupChecks: {
      last: async () => null,
      history: async () => [],
      append: async (r: unknown) => void setupRecords.push(r),
      acknowledgeLast: async () => null,
    } satisfies ISetupCheckRepository as ISetupCheckRepository,
  };
  return { cards, setupRecords, repos: repos as unknown as Repositories };
}

const scenario = { scenarioType: "job-interview", title: "Job interview" } as Scenario;

const wrong = "She go to the office every day";
const right = "She goes to the office every day";
const error = (turn: number): SilentError => ({ label: classifyError(wrong, right), original: wrong, corrected: right, turn });

describe("createEmmaRuntime", () => {
  it("finishSession pasa clipOfTurn: la tarjeta del error lleva el audioId de su turno (FR-011)", async () => {
    const { repos, cards } = fakeRepos();
    const runtime = await createEmmaRuntime({ llm: async () => "", repos });
    await runtime.finishSession({
      scenario, metric: { turns: 3, errors: 1 }, errors: [error(3)], level: "A2", messages: [],
      clipOfTurn: { 3: "learner-clip-3" },
    });
    expect(cards.find((c) => c.audioId === "learner-clip-3")).toBeDefined();
  });

  it("sin clipOfTurn las tarjetas se crean igual, sin audioId (retrocompatible)", async () => {
    const { repos, cards } = fakeRepos();
    const runtime = await createEmmaRuntime({ llm: async () => "", repos });
    await runtime.finishSession({ scenario, metric: { turns: 1, errors: 1 }, errors: [error(1)], level: "A2", messages: [] });
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.audioId === undefined)).toBe(true);
  });

  it("expone las fachadas audio y setup, y setup.run usa la sonda inyectada", async () => {
    const { repos, setupRecords } = fakeRepos();
    const probe: ISetupProbe = {
      probeVoice: async () => ({ status: "ok", engine: "native", ms: 200 }),
      probeAi: async () => ({ status: "ok", ms: 500, mode: "local", online: true, readiness: "ok", localModelAvailable: true }),
      probeMic: async () => ({ status: "granted", devices: 1 }),
    };
    const runtime = await createEmmaRuntime({ llm: async () => "OK", repos, probe });
    expect(typeof runtime.audio.saveLearnerTurn).toBe("function");
    const diagnosis = await runtime.setup.run({ trigger: "settings" });
    expect(diagnosis.verdict).toBe("pass");
    expect(setupRecords).toHaveLength(1);
  });

  describe("chatTurn reporta fallos en vivo sin perder el turno (FR-034)", () => {
    function listen() {
      const seen: unknown[] = [];
      const target = new EventTarget();
      target.addEventListener(SETUP_ISSUE, (e) => seen.push((e as CustomEvent).detail));
      vi.stubGlobal("window", target);
      return seen;
    }
    const turn = { system: "s", history: [], userMessage: "Hello" };

    it("un error del LLM se reporta como ai-error y el error sigue su camino", async () => {
      const seen = listen();
      const { repos } = fakeRepos();
      const runtime = await createEmmaRuntime({ llm: async () => { throw new Error("down"); }, repos });
      await expect(runtime.chatTurn(turn)).rejects.toThrow("down");
      expect(seen).toEqual([{ kind: "ai-error" }]);
      vi.unstubAllGlobals();
    });

    it("la degradación al mensaje de respaldo se reporta como ai-timeout y se devuelve igual", async () => {
      const seen = listen();
      const { repos } = fakeRepos();
      const runtime = await createEmmaRuntime({ llm: async () => "   ", repos });
      expect(await runtime.chatTurn(turn)).toBe(CHAT_FALLBACK);
      expect(seen).toEqual([{ kind: "ai-timeout" }]);
      vi.unstubAllGlobals();
    });
  });
});
