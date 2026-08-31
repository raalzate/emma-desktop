import { describe, it, expect } from "vitest";
import { personaFor, PROTOPERSONAS } from "../protopersona";

describe("protopersonas por escenario", () => {
  it("todo escenario del catálogo de turnos tiene protopersona con nombre propio", () => {
    const scenarioTypes = [
      "daily_standup",
      "code_review",
      "retrospective",
      "architecture_pitch",
      "morning_greeting",
      "slack_status_update",
      "meeting_intro",
      "coffee_break",
      "lunch_chat",
      "intro_yourself",
      "conference_intro",
      "ask_for_help",
      "vacation_request",
      "tech_interview",
      "incident_postmortem",
      "design_review",
    ];
    for (const type of scenarioTypes) {
      const p = PROTOPERSONAS[type];
      expect(p, `falta protopersona para ${type}`).toBeDefined();
      expect(p.name).toMatch(/\w+ \w+/); // nombre y apellido
      expect(p.personaPrompt.length).toBeGreaterThan(40);
      expect(p.uiDescription.length).toBeGreaterThan(10);
    }
  });

  it("personaFor cae a una persona genérica coherente con el rol si no hay entrada", () => {
    const p = personaFor("unknown_scenario", "Team Lead");
    expect(p.role).toBe("Team Lead");
    expect(p.name.length).toBeGreaterThan(0);
    expect(p.personaPrompt).toMatch(/Team Lead/);
  });

  it("los nombres son únicos entre escenarios (personas distinguibles)", () => {
    const names = Object.values(PROTOPERSONAS).map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("toda protopersona tiene voz propia coherente (femenina o masculina)", () => {
    for (const p of Object.values(PROTOPERSONAS)) {
      expect(["feminine", "masculine"]).toContain(p.voice);
    }
    expect(PROTOPERSONAS.daily_standup.voice).toBe("feminine"); // Sofía
    expect(PROTOPERSONAS.code_review.voice).toBe("masculine"); // Marcus
  });

  it("cada protopersona tiene voz TTS única, del catálogo válido y nunca la de Emma", () => {
    // Catálogo de voces Edge-TTS disponibles (provisto por producto).
    const VALID_VOICES = new Set([
      "en-US-JennyNeural", "en-US-AriaNeural", "en-US-AnaNeural",
      "en-US-GuyNeural", "en-US-AndrewMultilingualNeural", "en-US-EricNeural",
      "en-US-RogerNeural", "en-US-SteffanNeural", "en-US-ChristopherNeural",
      "en-GB-LibbyNeural", "en-GB-MaisieNeural", "en-GB-SoniaNeural",
      "en-GB-RyanNeural", "en-GB-OliverNeural", "en-GB-ThomasNeural",
      "en-AU-NatashaNeural", "en-AU-KimNeural", "en-AU-WilliamNeural",
      "en-CA-ClaraNeural", "en-CA-LiamNeural",
      "en-IN-NeerjaNeural", "en-IN-PrabhatNeural",
      "en-IE-EmilyNeural", "en-IE-ConnorNeural",
      "en-NZ-MollyNeural", "en-NZ-MitchellNeural",
      "en-PH-RosaNeural", "en-PH-JamesNeural",
      "en-ZA-LeahNeural", "en-ZA-LukeNeural",
      "en-SG-LunaNeural", "en-SG-WayneNeural",
    ]);
    const voices = Object.values(PROTOPERSONAS).map((p) => p.ttsVoice);
    expect(new Set(voices).size).toBe(voices.length);
    for (const v of voices) {
      expect(VALID_VOICES.has(v), `voz fuera de catálogo: ${v}`).toBe(true);
      expect(v).not.toMatch(/Emma/); // EmmaNeural/EmmaMultilingual: reservadas para la tutora
    }
  });
});
