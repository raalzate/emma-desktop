/**
 * Análisis enriquecido de un ítem de ejercicio tras responder: palabra,
 * pronunciación, traducción, por qué esa respuesta y un ejemplo. El prompt es
 * determinista y el parser tolera la deriva de formato del modelo pequeño.
 */

import { describe, it, expect } from "vitest";
import { anchorExplanation, explanationPrompt, parseExplanation } from "../item-explanation";
import type { UnitExercise } from "../exercise";

const exercise: UnitExercise = {
  id: "P1.5",
  unit: 0,
  kind: "classify",
  promptEs: "¿Cómo suena la -ed final de este verbo en pasado? Elige /t/, /d/ o /ɪd/.",
  items: [{ stem: "shipped", answer: "/t/", noteEs: "p es sorda → /t/" }],
};

describe("explanationPrompt", () => {
  it("lleva la consigna, el ítem, la respuesta correcta y lo que el aprendiz contestó", () => {
    const { system, prompt } = explanationPrompt({ exercise, item: exercise.items[0], given: "/ɪd/" });
    expect(system).toMatch(/WORD:/);
    expect(system).toMatch(/IPA:/);
    expect(system).toMatch(/TRANSLATION:/);
    expect(system).toMatch(/WHY:/);
    expect(system).toMatch(/EXAMPLE:/);
    expect(prompt).toContain("shipped");
    expect(prompt).toContain("Correct answer: /t/");
    expect(prompt).toContain("Learner answered: /ɪd/");
    expect(prompt).toContain(exercise.promptEs);
  });
  it("si acertó, no inventa una respuesta equivocada", () => {
    const { prompt } = explanationPrompt({ exercise, item: exercise.items[0], given: "/t/" });
    expect(prompt).not.toContain("Learner answered");
  });
  it("pide traducción y explicación en español, ejemplo en inglés", () => {
    const { system } = explanationPrompt({ exercise, item: exercise.items[0], given: "/t/" });
    expect(system).toMatch(/TRANSLATION.*Spanish/);
    expect(system).toMatch(/WHY.*Spanish/);
    expect(system).toMatch(/EXAMPLE.*English/);
  });
});

// Incidente 2026-11-24: en un ítem de clasificación («shipped» → /t/) la
// tarjeta salía con «/t/» como palabra y «sonido /t/» como traducción. La
// palabra que se explica es el ÍTEM; la categoría es sólo la respuesta.
describe("palabra objetivo en ítems de clasificación", () => {
  it("el prompt fija la palabra del ítem como WORD y pide traducir la palabra, no el sonido", () => {
    const { prompt } = explanationPrompt({ exercise, item: exercise.items[0], given: "/t/" });
    expect(prompt).toContain("Target word: shipped");
    expect(prompt).toMatch(/TRANSLATION.*shipped/);
  });
  it("anchorExplanation impone la palabra del ítem y descarta la IPA que es sólo la categoría", () => {
    const parsed = {
      word: "/t/",
      ipa: "/t/",
      translationEs: "sonido /t/",
      whyEs: "El verbo termina en sonido sordo.",
    };
    expect(anchorExplanation(parsed, exercise, exercise.items[0])).toEqual({
      word: "shipped",
      translationEs: "sonido /t/",
      whyEs: "El verbo termina en sonido sordo.",
    });
  });
  it("conserva la IPA cuando es la de la palabra", () => {
    const parsed = { word: "shipped", ipa: "/ʃɪpt/", translationEs: "enviado", whyEs: "p sorda." };
    expect(anchorExplanation(parsed, exercise, exercise.items[0])).toEqual(parsed);
  });
  it("fuera de clasificación no toca la explicación", () => {
    const fill: UnitExercise = { ...exercise, kind: "fill" };
    const parsed = { word: "deploy", ipa: "/dɪˈplɔɪ/", translationEs: "desplegar", whyEs: "verbo." };
    expect(anchorExplanation(parsed, fill, { stem: "We ___ on Fridays.", answer: "deploy" })).toEqual(parsed);
    expect(explanationPrompt({ exercise: fill, item: { stem: "x", answer: "deploy" }, given: "deploy" }).prompt).not.toContain("Target word");
  });
});

describe("parseExplanation", () => {
  it("lee las claves aunque vengan en negrita, con viñetas y CRLF", () => {
    const raw =
      "**WORD:** shipped\r\n- IPA: /ʃɪpt/\r\nTRANSLATION: enviado, despachado\r\n" +
      "WHY: «ship» termina en /p/, un sonido sordo, así que la -ed suena /t/ sin sílaba extra.\r\n" +
      "EXAMPLE: We shipped the release on Friday.\r\nEXAMPLE_ES: Enviamos la versión el viernes.";
    expect(parseExplanation(raw)).toEqual({
      word: "shipped",
      ipa: "/ʃɪpt/",
      translationEs: "enviado, despachado",
      whyEs: "«ship» termina en /p/, un sonido sordo, así que la -ed suena /t/ sin sílaba extra.",
      exampleEn: "We shipped the release on Friday.",
      exampleEs: "Enviamos la versión el viernes.",
    });
  });
  it("sin WHY ni TRANSLATION no hay explicación", () => {
    expect(parseExplanation("WORD: shipped\nIPA: /ʃɪpt/")).toBeNull();
    expect(parseExplanation("")).toBeNull();
  });
  it("los campos opcionales pueden faltar", () => {
    const parsed = parseExplanation("WORD: shipped\nTRANSLATION: enviado\nWHY: porque sí.");
    expect(parsed).toMatchObject({ word: "shipped", translationEs: "enviado", whyEs: "porque sí." });
    expect(parsed?.ipa).toBeUndefined();
  });
});
