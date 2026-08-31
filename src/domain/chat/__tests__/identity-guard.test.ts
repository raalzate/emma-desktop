import { describe, it, expect } from "vitest";
import {
  hasIdentityLeak,
  removeIdentityLeak,
  IN_CHARACTER_RECOVERY,
} from "../identity-guard";

describe("identity-guard — detección de fuga de identidad de IA", () => {
  it("detecta 'as a large language model'", () => {
    expect(
      hasIdentityLeak("As a large language model, I need a bit more information."),
    ).toBe(true);
  });

  it("detecta variantes: 'as an AI' e 'I am an AI assistant'", () => {
    expect(hasIdentityLeak("As an AI, I cannot do that.")).toBe(true);
    expect(hasIdentityLeak("Well, I am an AI assistant after all.")).toBe(true);
    expect(hasIdentityLeak("I'm just a language model.")).toBe(true);
  });

  it("no marca conversación normal de trabajo", () => {
    expect(hasIdentityLeak("Yesterday I finished the login API, no blockers.")).toBe(false);
    expect(hasIdentityLeak("The model failed in staging — can you check the logs?")).toBe(false);
  });
});

describe("identity-guard — limpieza en personaje", () => {
  it("elimina solo las oraciones con fuga y conserva el resto", () => {
    const raw =
      "As a large language model, I need more context. " +
      "Anyway, what did you work on yesterday?";
    expect(removeIdentityLeak(raw)).toBe("Anyway, what did you work on yesterday?");
  });

  it("si toda la respuesta era fuga devuelve cadena vacía (el caller decide el fallback)", () => {
    expect(removeIdentityLeak("As an AI, I do not have that information.")).toBe("");
  });

  it("expone una línea de recuperación en personaje (no el fallback técnico)", () => {
    expect(IN_CHARACTER_RECOVERY).not.toMatch(/\b(EMMA|AI|model)\b/i);
    expect(IN_CHARACTER_RECOVERY.length).toBeGreaterThan(10);
  });
});
