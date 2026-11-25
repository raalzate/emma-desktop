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
    for (const tag of ["grammar", "suggest", "complete-reply", "scene-facts", "lesson", "prewarm", undefined]) {
      expect(routeFor(tag, s)).toBe("local");
    }
  });

  it("en modo remoto todo va a la nube, como siempre", () => {
    expect(routeFor("grammar", { ...local, mode: "remote" })).toBe("remote");
  });

  it("el turno son exactamente chat, chat-retry y observe", () => {
    expect([...TURN_TAGS].sort()).toEqual(["chat", "chat-retry", "observe"]);
  });
});

describe("withCloudFallback (FR-003)", () => {
  it("usa la respuesta de la nube cuando llega", async () => {
    const { withCloudFallback } = await import("../turn-routing");
    const out = await withCloudFallback(async () => "cloud", async () => "local");
    expect(out).toBe("cloud");
  });

  it("si la nube falla (sin red, sin llave), el turno se genera en local", async () => {
    const { withCloudFallback } = await import("../turn-routing");
    const out = await withCloudFallback(
      async () => {
        throw new Error("No API key");
      },
      async () => "local",
    );
    expect(out).toBe("local");
  });

  it("una cancelación no se reintenta en local", async () => {
    const { withCloudFallback } = await import("../turn-routing");
    const ctl = new AbortController();
    ctl.abort();
    let usedLocal = false;
    await expect(
      withCloudFallback(
        async () => "cloud",
        async () => {
          usedLocal = true;
          return "local";
        },
        ctl.signal,
      ),
    ).rejects.toThrow(/abort/i);
    expect(usedLocal).toBe(false);
  });
});

describe("cableado en el adaptador", () => {
  it("el adaptador rutea por tag y usa el respaldo local", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/lib/ai/llm-adapter.ts", "utf8");
    expect(src).toMatch(/routeFor\(args\.tag, settings\)/);
    expect(src).toMatch(/withCloudFallback\(/);
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
