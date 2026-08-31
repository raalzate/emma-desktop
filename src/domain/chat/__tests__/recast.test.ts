/**
 * Recast: la persona devuelve la forma correcta dentro de su propia respuesta,
 * en personaje y sin señalar el error.
 *
 * El "why": la corrección silenciosa llega al final de la sesión, media hora
 * después de producir el error. La práctica deliberada exige feedback inmediato
 * (Ericsson) y en conversación el vehículo canónico es la reformulación natural
 * (recast, Long) — corrige sin romper la inmersión ni cambiar de idioma.
 */

import { describe, expect, it } from "vitest";
import { buildRecastCue } from "@/domain/chat/recast";
import type { SilentError } from "@/domain/chat/silent-error";

function error(original: string, corrected: string): SilentError {
  return { label: "grammar", original, corrected };
}

describe("buildRecastCue", () => {
  it("pide tejer la forma corregida en la respuesta, sin mencionar gramática", () => {
    const cue = buildRecastCue([error("i am working in the testing", "I'm working on the testing")]);
    expect(cue).toContain("I'm working on the testing");
    expect(cue.toLowerCase()).toContain("never mention");
    expect(cue.toLowerCase()).toContain("in character");
  });

  it("usa la corrección más reciente cuando hay varias", () => {
    const cue = buildRecastCue([
      error("i have 30 years", "I'm 30 years old"),
      error("i need access to api key", "I need access to the API key"),
    ]);
    expect(cue).toContain("I need access to the API key");
    expect(cue).not.toContain("I'm 30 years old");
  });

  it("no produce directiva si no hay errores", () => {
    expect(buildRecastCue([])).toBe("");
  });

  it("descarta correcciones que no aportan cambio", () => {
    expect(buildRecastCue([error("I need access", "I need access")])).toBe("");
    expect(buildRecastCue([error("I need access", "  ")])).toBe("");
  });

  it("ignora las meta-notas del corrector y usa la corrección real anterior", () => {
    const cue = buildRecastCue([
      error("i fixed the bug", "I fixed the bug yesterday"),
      error("all good", "no correction needed"),
    ]);
    expect(cue).toContain("I fixed the bug yesterday");
  });
});
