/**
 * #169 — cuatro reglas de turno hablado, con sus fronteras. La regla es pura:
 * si algo de esto se decidiera en el componente, la sesión podría bloquearse
 * sin que ninguna prueba lo notara.
 */

import { describe, it, expect } from "vitest";
import { requiresVoice, DEFAULT_VOICE_IDLE_TURNS } from "../voice-requirement";

const base = {
  turn: 5,
  maxTurns: 12,
  lastVoiceTurn: 4,
  expectsElaboration: false,
};

describe("requiresVoice", () => {
  it("el primer turno de la escena se saluda hablando", () => {
    const req = requiresVoice({ ...base, turn: 1, lastVoiceTurn: null });
    expect(req?.reason).toBe("greeting");
    expect(req?.promptEs).toContain("saluda con tu voz");
  });

  it("el último turno antes del fin se cierra hablando", () => {
    expect(requiresVoice({ ...base, turn: 12 })?.reason).toBe("closing");
  });

  it("cuando la directiva pide desarrollar, se explica en voz alta", () => {
    expect(requiresVoice({ ...base, expectsElaboration: true })?.reason).toBe(
      "detailed_explanation",
    );
  });

  it("un turno normal no exige voz: texto y voz siguen disponibles", () => {
    expect(requiresVoice(base)).toBeNull();
  });
});

describe("inactividad de voz — frontera N-1 / N", () => {
  it(`a los ${DEFAULT_VOICE_IDLE_TURNS - 1} turnos sin voz todavía no exige`, () => {
    // Última nota de voz en el turno 4; va a decir el 7 → 2 turnos completados.
    expect(requiresVoice({ ...base, turn: 7, lastVoiceTurn: 4 })).toBeNull();
  });

  it(`a los ${DEFAULT_VOICE_IDLE_TURNS} turnos sin voz exige hablar`, () => {
    expect(requiresVoice({ ...base, turn: 8, lastVoiceTurn: 4 })?.reason).toBe("voice_idle");
  });

  it("sin ninguna nota de voz cuenta desde el inicio de la escena", () => {
    expect(requiresVoice({ ...base, turn: 4, lastVoiceTurn: null })?.reason).toBe("voice_idle");
    expect(requiresVoice({ ...base, turn: 3, lastVoiceTurn: null })).toBeNull();
  });

  it("el umbral es configurable", () => {
    expect(requiresVoice({ ...base, turn: 6, lastVoiceTurn: 4, idleThreshold: 1 })?.reason).toBe(
      "voice_idle",
    );
    expect(requiresVoice({ ...base, turn: 8, lastVoiceTurn: 4, idleThreshold: 9 })).toBeNull();
  });
});

describe("salida de emergencia", () => {
  it("si el aprendiz declaró que no puede hablar, ningún turno exige voz", () => {
    expect(
      requiresVoice({ ...base, turn: 1, lastVoiceTurn: null, voiceUnavailable: true }),
    ).toBeNull();
    expect(requiresVoice({ ...base, turn: 12, voiceUnavailable: true })).toBeNull();
  });
});

describe("prioridad entre reglas", () => {
  it("el saludo manda sobre el cierre y sobre la explicación", () => {
    expect(
      requiresVoice({
        turn: 1,
        maxTurns: 1,
        lastVoiceTurn: null,
        expectsElaboration: true,
      })?.reason,
    ).toBe("greeting");
  });

  it("el cierre manda sobre la explicación y la inactividad", () => {
    expect(
      requiresVoice({ ...base, turn: 12, expectsElaboration: true, lastVoiceTurn: null })?.reason,
    ).toBe("closing");
  });
});
