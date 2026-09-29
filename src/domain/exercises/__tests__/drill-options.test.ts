/**
 * Opciones cerradas de un ejercicio: cuándo un ítem se responde tocando una
 * opción (clasificar, elegir, sílaba fuerte) y cuándo se escribe.
 */

import { describe, expect, it } from "vitest";
import { optionsFor, describeInteraction } from "../drill-options";
import type { UnitExercise } from "../exercise";

const classify: UnitExercise = {
  id: "P1.5",
  unit: 0,
  kind: "classify",
  promptEs: "¿Cómo suena la -ed?",
  items: [
    { stem: "shipped", answer: "/t/" },
    { stem: "migrated", answer: "/ɪd/" },
    { stem: "rolled", answer: "/d/" },
    { stem: "mocked", answer: "/t/" },
  ],
};

const stress: UnitExercise = {
  id: "P1.7",
  unit: 0,
  kind: "choose",
  promptEs: "Sílaba fuerte",
  items: [
    { stem: "deployment", answer: "dePLOYment" },
    { stem: "configuration", answer: "configuRAtion" },
  ],
};

const choosePhrase: UnitExercise = {
  id: "17B",
  unit: 17,
  kind: "choose",
  promptEs: "Elige la frase adecuada.",
  items: [
    { stem: "Se cortó la llamada.", answer: "Sorry, you cut out." },
    { stem: "Quieres interrumpir.", answer: "Sorry to stop you." },
  ],
};

const fill: UnitExercise = {
  id: "14A",
  unit: 14,
  kind: "fill",
  promptEs: "Completa.",
  items: [{ stem: "He ____ (go)", answer: "went" }],
};

describe("optionsFor", () => {
  it("clasificar: las categorías distintas del ejercicio, en orden de aparición y sin repetir", () => {
    expect(optionsFor(classify, 0)).toEqual(["/t/", "/ɪd/", "/d/"]);
  });

  it("sílaba fuerte: una opción por sílaba, con la fuerte en mayúsculas, incluida la correcta", () => {
    expect(optionsFor(stress, 0)).toEqual(["DEployment", "dePLOYment", "deployMENT"]);
    expect(optionsFor(stress, 1)).toContain("configuRAtion");
    // La respuesta sólo marca la sílaba fuerte: los tramos en minúscula
    // alrededor cuentan como una sola opción cada uno.
    expect(optionsFor(stress, 1)).toEqual(["CONFIGUration", "configuRAtion", "configuraTION"]);
  });

  it("elegir frase: las respuestas del ejercicio como opciones", () => {
    expect(optionsFor(choosePhrase, 0)).toEqual(["Sorry, you cut out.", "Sorry to stop you."]);
  });

  it("completar y demás tipos se escriben: sin opciones", () => {
    expect(optionsFor(fill, 0)).toBeNull();
  });

  it("un ejercicio de elegir con una sola respuesta distinta se escribe (no hay nada que elegir)", () => {
    const one: UnitExercise = { ...choosePhrase, items: [choosePhrase.items[0]] };
    expect(optionsFor(one, 0)).toBeNull();
  });

  it("si la consigna pide escribir, no ofrece opciones aunque el tipo sea elegir", () => {
    const writes: UnitExercise = { ...choosePhrase, promptEs: "Escribe una frase para cada palanca." };
    expect(optionsFor(writes, 0)).toBeNull();
  });
});

describe("describeInteraction", () => {
  it("explica en inglés cómo se responde según haya opciones o no", () => {
    expect(describeInteraction(classify, 0)).toMatch(/Tap/);
    expect(describeInteraction(fill, 0)).toMatch(/Type/);
  });
});
