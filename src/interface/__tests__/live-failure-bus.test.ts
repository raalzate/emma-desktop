import { describe, expect, it, vi } from "vitest";
import { onLiveFailure, reportLiveFailure, SETUP_ISSUE, watchChatTurn } from "../live-failure-bus";
import type { LiveFailure } from "@/domain/setup/live-failure";

describe("bus de fallos en vivo (FR-034)", () => {
  it("reportLiveFailure despacha emma:setup-issue con el fallo en detail", () => {
    const target = new EventTarget();
    const seen: LiveFailure[] = [];
    target.addEventListener(SETUP_ISSUE, (e) => seen.push((e as CustomEvent<LiveFailure>).detail));
    reportLiveFailure({ kind: "voice-fallback" }, target);
    expect(seen).toEqual([{ kind: "voice-fallback" }]);
  });

  it("sin ventana (SSR/pruebas) no lanza", () => {
    expect(() => reportLiveFailure({ kind: "ai-error" }, undefined)).not.toThrow();
  });

  it("onLiveFailure suscribe y devuelve la función para desuscribir", () => {
    const target = new EventTarget();
    const handler = vi.fn();
    const off = onLiveFailure(handler, target);
    reportLiveFailure({ kind: "ai-timeout" }, target);
    off();
    reportLiveFailure({ kind: "ai-timeout" }, target);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ kind: "ai-timeout" });
  });
});

describe("watchChatTurn", () => {
  const FALLBACK = "EMMA is having trouble responding right now. Please try again.";

  it("devuelve la respuesta intacta y no reporta si todo va bien", async () => {
    const report = vi.fn();
    expect(await watchChatTurn(async () => "Hello!", report)).toBe("Hello!");
    expect(report).not.toHaveBeenCalled();
  });

  it("si el LLM lanza, reporta ai-error y relanza el MISMO error (el turno sigue su camino)", async () => {
    const report = vi.fn();
    const boom = new Error("boom");
    await expect(watchChatTurn(async () => { throw boom; }, report)).rejects.toBe(boom);
    expect(report).toHaveBeenCalledWith({ kind: "ai-error" });
  });

  it("si el turno degrada al mensaje de respaldo, reporta ai-timeout y devuelve igual el mensaje", async () => {
    const report = vi.fn();
    expect(await watchChatTurn(async () => FALLBACK, report)).toBe(FALLBACK);
    expect(report).toHaveBeenCalledWith({ kind: "ai-timeout" });
  });

  it("un AbortError (cancelación del usuario) no se reporta como fallo", async () => {
    const report = vi.fn();
    const abort = Object.assign(new Error("a"), { name: "AbortError" });
    await expect(watchChatTurn(async () => { throw abort; }, report)).rejects.toBe(abort);
    expect(report).not.toHaveBeenCalled();
  });

  it("un reporte que falla no rompe el turno", async () => {
    const report = () => { throw new Error("listener"); };
    expect(await watchChatTurn(async () => FALLBACK, report)).toBe(FALLBACK);
  });
});

describe("watchChatTurn mide la latencia del turno (T18 de #323)", () => {
  it("tras 3 turnos lentos reporta ai-slow una vez por racha", async () => {
    const { watchChatTurn, resetTurnTimes } = await import("../live-failure-bus");
    const { SLOW_TURN_MS } = await import("@/domain/setup/live-failure");
    resetTurnTimes();
    const reports: string[] = [];
    let t = 0;
    const now = () => t;
    for (let i = 0; i < 3; i++) {
      await watchChatTurn(
        async () => {
          t += SLOW_TURN_MS + 1000;
          return "Sure.";
        },
        (f) => reports.push(f.kind),
        now,
      );
    }
    expect(reports).toEqual(["ai-slow"]);
  });

  it("turnos rápidos no reportan nada", async () => {
    const { watchChatTurn, resetTurnTimes } = await import("../live-failure-bus");
    resetTurnTimes();
    const reports: string[] = [];
    let t = 0;
    for (let i = 0; i < 4; i++) {
      await watchChatTurn(
        async () => {
          t += 2000;
          return "Sure.";
        },
        (f) => reports.push(f.kind),
        () => t,
      );
    }
    expect(reports).toEqual([]);
  });
});
