/**
 * Respuestas de la conversación en la nube (#348, T1–T2): sólo el turno de
 * práctica sale del equipo; todo lo demás sigue local.
 */
import { describe, expect, it } from "vitest";
import { routeFor, TURN_TAGS } from "../turn-routing";
import { DEFAULT_AI_SETTINGS, normalizeSettings } from "../remote-settings";

const local = { ...DEFAULT_AI_SETTINGS, mode: "local" as const };

describe("normalizeSettings · replyInCloud", () => {
  it("por defecto está apagado", () => {
    expect(DEFAULT_AI_SETTINGS.replyInCloud).toBe(false);
    expect(normalizeSettings({}).replyInCloud).toBe(false);
  });

  it("sólo un booleano true lo enciende (entrada del almacén)", () => {
    expect(normalizeSettings({ replyInCloud: true }).replyInCloud).toBe(true);
    expect(normalizeSettings({ replyInCloud: "yes" }).replyInCloud).toBe(false);
  });
});

describe("routeFor", () => {
  it("apagado: todo local", () => {
    for (const tag of ["chat", "observe", "grammar", undefined]) expect(routeFor(tag, local)).toBe("local");
  });

  it("encendido: el turno va a la nube y lo demás sigue local", () => {
    const s = { ...local, replyInCloud: true };
    expect(routeFor("chat", s)).toBe("remote");
    expect(routeFor("chat-retry", s)).toBe("remote");
    expect(routeFor("observe", s)).toBe("remote");
    for (const tag of ["grammar", "suggest", "complete-reply", "scene-briefing", "lesson", "prewarm", undefined]) {
      expect(routeFor(tag, s)).toBe("local");
    }
  });

  it("en modo remoto todo va a la nube, como siempre", () => {
    expect(routeFor("grammar", { ...local, mode: "remote" })).toBe("remote");
  });

  // Ampliado en #353 (decisión del usuario): los hechos de la escena también.
  it("van a la nube el turno y los hechos de la escena, nada más", () => {
    expect([...TURN_TAGS].sort()).toEqual(["chat", "chat-retry", "observe", "scene-facts"]);
  });
});


describe("cableado en el adaptador", () => {
  it("el adaptador rutea por tag y usa el respaldo local", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/lib/ai/llm-adapter.ts", "utf8");
    expect(src).toMatch(/routeFor\(args\.tag, settings\)/);
    expect(src).toMatch(/hedgedTurn\(/);
  });
});

describe("modelos de Gemini vigentes (#353)", () => {
  // Medido el 2026-11-25: gemini-2.5-flash-lite y gemini-2.5-pro responden 404
  // (retirados); gemini-flash-lite-latest responde en ~1,2 s.
  it("la lista no ofrece modelos retirados y el default es el alias rápido", async () => {
    const { providerInfo } = await import("../remote-settings");
    const g = providerInfo("gemini");
    expect(g.models).not.toContain("gemini-2.5-flash-lite");
    expect(g.models).not.toContain("gemini-2.5-pro");
    expect(g.defaultModel).toBe("gemini-flash-lite-latest");
    expect(g.models).toContain(g.defaultModel);
  });

  it("un modelo guardado que ya no se ofrece vuelve al de por defecto", () => {
    const s = normalizeSettings({ provider: "gemini", models: { gemini: "gemini-2.5-flash-lite" } });
    expect(s.models.gemini).toBeUndefined();
  });
});


describe("hedgedTurn: nube con respaldo local en carrera (#353)", () => {
  // Diagnóstico: la cola del banco (p95 ~12 s) era la nube misma (4–6,5 s en
  // la capa gratuita), no el respaldo. Si la nube no respondió en 1,5 s se
  // lanza también el modelo local y gana el primero.
  it("si la nube responde rápido, el local ni arranca", async () => {
    const { hedgedTurn } = await import("../turn-routing");
    let localStarted = false;
    const out = await hedgedTurn(
      async () => "cloud",
      async () => {
        localStarted = true;
        return "local";
      },
      { hedgeAfterMs: 50 },
    );
    expect(out).toBe("cloud");
    expect(localStarted).toBe(false);
  });

  it("si la nube tarda, arranca el local y gana el primero; el perdedor se cancela", async () => {
    const { hedgedTurn } = await import("../turn-routing");
    let localSignal: AbortSignal | undefined;
    const out = await hedgedTurn(
      () => new Promise<string>((r) => setTimeout(() => r("cloud"), 200)),
      (signal) => {
        localSignal = signal;
        return new Promise<string>((r) => setTimeout(() => r("local"), 20));
      },
      { hedgeAfterMs: 10 },
    );
    expect(out).toBe("local");
    expect(localSignal?.aborted).toBe(false);
  });

  it("si la nube gana después de arrancar el local, el local se cancela", async () => {
    const { hedgedTurn } = await import("../turn-routing");
    let localSignal: AbortSignal | undefined;
    const out = await hedgedTurn(
      () => new Promise<string>((r) => setTimeout(() => r("cloud"), 30)),
      (signal) => {
        localSignal = signal;
        return new Promise<string>((r) => setTimeout(() => r("local"), 500));
      },
      { hedgeAfterMs: 10 },
    );
    expect(out).toBe("cloud");
    expect(localSignal?.aborted).toBe(true);
  });

  it("si la nube falla, gana el local aunque no haya pasado el plazo", async () => {
    const { hedgedTurn } = await import("../turn-routing");
    const out = await hedgedTurn(
      async () => {
        throw new Error("quota");
      },
      async () => "local",
      { hedgeAfterMs: 10_000 },
    );
    expect(out).toBe("local");
  });

  it("si fallan los dos, se propaga el error del local", async () => {
    const { hedgedTurn } = await import("../turn-routing");
    await expect(
      hedgedTurn(
        async () => {
          throw new Error("quota");
        },
        async () => {
          throw new Error("engine");
        },
        { hedgeAfterMs: 1 },
      ),
    ).rejects.toThrow("engine");
  });
});
