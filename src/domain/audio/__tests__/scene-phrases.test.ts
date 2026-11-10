import { describe, expect, it } from "vitest";
import type { NarrationBeat } from "@/domain/chat/scene-narration";
import type { SilentError } from "@/domain/chat/silent-error";
import { MAX_CORRECTION_PHRASES, MAX_SCENE_PHRASES, phrasesToKeep } from "../scene-phrases";

const beat = (text: string): NarrationBeat => ({ kind: "setting", text });
const error = (original: string, corrected: string, label: SilentError["label"] = "grammar"): SilentError => ({
  label, original, corrected,
});

describe("phrasesToKeep", () => {
  it("de la franja SCENE guarda sólo las oraciones con una frase clave", () => {
    const out = phrasesToKeep({
      narration: [beat("It is a quiet day. The deploy failed at 3pm, so hurry.")],
      corrections: [],
    });
    expect(out).toEqual([{ text: "The deploy failed at 3pm, so hurry.", source: "scene" }]);
  });

  it("sin nada clave ni correcciones no devuelve nada", () => {
    expect(phrasesToKeep({ narration: [beat("it is quiet and calm.")], corrections: [] })).toEqual([]);
  });

  it("el nombre de la persona cuenta como frase clave", () => {
    const out = phrasesToKeep({ narration: [beat("you talk with marta today.")], personaName: "marta", corrections: [] });
    expect(out.map((p) => p.source)).toEqual(["scene"]);
  });

  it("de las correcciones guarda el texto corregido y descarta las no reportables", () => {
    const out = phrasesToKeep({
      narration: [],
      corrections: [
        error("I go home yesterday", "I went home yesterday"),
        error("same", "same"),
        error("hello.", "Hello.", "capitalization"),
      ],
    });
    expect(out).toEqual([{ text: "I went home yesterday", source: "correction" }]);
  });

  it("no repite frases (normalizadas) entre escena y correcciones", () => {
    const out = phrasesToKeep({
      narration: [beat("The meeting is at 3pm.")],
      corrections: [error("the meeting are at 3pm", "the  MEETING is at 3pm.")],
    });
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("scene");
  });

  it("respeta los topes por fuente", () => {
    const narration = Array.from({ length: 10 }, (_, i) => beat(`Sprint ${i + 1} starts at ${i + 1}pm.`));
    const corrections = Array.from({ length: 10 }, (_, i) => error(`she go to school ${i}`, `she goes to school ${i}`, "word_form"));
    const out = phrasesToKeep({ narration, corrections });
    expect(out.filter((p) => p.source === "scene")).toHaveLength(MAX_SCENE_PHRASES);
    expect(out.filter((p) => p.source === "correction")).toHaveLength(MAX_CORRECTION_PHRASES);
  });
});
