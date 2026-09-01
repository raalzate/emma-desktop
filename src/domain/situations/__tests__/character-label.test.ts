import { describe, it, expect } from "vitest";
import { characterLabel } from "../character-label";
import type { SituationCharacter } from "../situation-variant";

const CHARACTERS: SituationCharacter[] = ["incident", "onboarding", "routine", "conflict"];

describe("characterLabel", () => {
  it("etiqueta cada carácter en inglés (contenido de escena, no andamiaje)", () => {
    expect(characterLabel("routine")).toBe("Routine");
    expect(characterLabel("incident")).toBe("Incident");
    expect(characterLabel("conflict")).toBe("Conflict");
    expect(characterLabel("onboarding")).toBe("Onboarding");
  });

  it("ninguna etiqueta queda en español", () => {
    for (const c of CHARACTERS) {
      expect(characterLabel(c)).not.toMatch(/[áéíóúñ]|Rutina|Incidente|Conflicto/i);
    }
  });

  it("todas las etiquetas son distintas entre sí", () => {
    const labels = CHARACTERS.map(characterLabel);
    expect(new Set(labels).size).toBe(CHARACTERS.length);
  });
});
