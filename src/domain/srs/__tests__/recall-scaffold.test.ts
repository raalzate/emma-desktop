/**
 * Andamiaje del recuerdo activo: pista con hueco sobre la parte corregida y
 * diferencia palabra a palabra tras comprobar, para que el repaso corrija en
 * vez de sólo decir "mal".
 */

import { describe, expect, it } from "vitest";
import {
  recallHint,
  wordDiff,
  recallPromptEs,
  recallFront,
  recallGaps,
  recallContext,
  recallTarget,
  isTeachableCard,
} from "../recall-check";
import type { SrsCard } from "../srs-card";

const production: SrsCard = {
  id: "c1",
  kind: "sentence-production",
  box: 1,
  lastReviewedDay: 0,
  front: 'Corrige esta frase: "i am working about new features"',
  back: "I am working on new features",
};

const cloze: SrsCard = {
  id: "c2",
  kind: "chunk-cloze",
  box: 1,
  lastReviewedDay: 0,
  front: "He ____ (go) home",
  back: "went",
};

describe("recallGaps", () => {
  it("producción: hueco en cada palabra corregida, en orden", () => {
    expect(recallGaps(production)).toEqual({
      masked: "I am working ___ new features",
      missing: ["on"],
    });
  });
  it("sin palabras nuevas (sólo mayúsculas o puntuación) no hay huecos", () => {
    expect(recallGaps({ ...production, front: 'Corrige esta frase: "i am working on new features"' })).toBeNull();
  });
  it("otras tarjetas no tienen huecos", () => {
    expect(recallGaps(cloze)).toBeNull();
  });
});

describe("recallHint", () => {
  it("producción: primera letra y longitud de cada palabra que falta, el resto entero", () => {
    expect(recallHint(production)).toBe("I am working o_ new features");
  });

  it("producción sin huecos: primera letra y longitud de toda la clave", () => {
    expect(recallHint({ ...production, front: 'Corrige esta frase: "i am working on new features"' })).toBe(
      "I a_ w______ o_ n__ f_______",
    );
  });

  it("cloze: primera letra y longitud de la clave", () => {
    expect(recallHint(cloze)).toBe("w___");
  });
});

describe("recallContext", () => {
  it("producción: lo que el aprendiz escribió, para no perder el sentido", () => {
    expect(recallContext(production)).toBe("i am working about new features");
  });
  it("otras tarjetas no tienen contexto", () => {
    expect(recallContext(cloze)).toBeNull();
  });
});

describe("recallTarget", () => {
  it("si se escriben sólo las palabras que faltan, la clave es esa lista", () => {
    expect(recallTarget(production, "on")).toBe("on");
  });
  it("si se escribe más que los huecos, la clave es la frase entera", () => {
    expect(recallTarget(production, "I am working on new features")).toBe(production.back);
  });
  it("sin huecos la clave es siempre la frase entera", () => {
    expect(recallTarget(cloze, "w")).toBe(cloze.back);
  });
});

describe("wordDiff", () => {
  it("marca palabra a palabra qué coincide con la respuesta esperada", () => {
    expect(wordDiff("I am working on new features", "I am working about new features")).toEqual([
      { word: "I", ok: true },
      { word: "am", ok: true },
      { word: "working", ok: true },
      { word: "on", ok: false },
      { word: "new", ok: true },
      { word: "features", ok: true },
    ]);
  });

  it("si faltan palabras al final, las esperadas quedan marcadas como faltantes", () => {
    expect(wordDiff("I went home", "I went")).toEqual([
      { word: "I", ok: true },
      { word: "went", ok: true },
      { word: "home", ok: false },
    ]);
  });
});

describe("recallFront", () => {
  it("producción con huecos: la consigna es la frase corregida con huecos para completar", () => {
    expect(recallFront(production)).toBe("I am working ___ new features");
    expect(recallFront({ ...production, front: 'Di esto correctamente: "I go yesterday"', back: "I went yesterday" })).toBe(
      "I ___ yesterday",
    );
  });
  it("producción sin huecos cae a la consigna de escribir la frase entera, incluso en tarjetas viejas", () => {
    expect(recallFront({ ...production, front: 'Di esto correctamente: "i am working on new features"' })).toBe(
      'Write this sentence correctly: "i am working on new features"',
    );
  });
  it("otras tarjetas se muestran tal cual", () => {
    expect(recallFront(cloze)).toBe(cloze.front);
  });
});

describe("recallPromptEs", () => {
  it("dice lo que hay que hacer con cada tipo de tarjeta, en inglés", () => {
    expect(recallPromptEs("sentence-production", production)).toMatch(/missing words/);
    expect(
      recallPromptEs("sentence-production", { ...production, front: 'Corrige esta frase: "i am working on new features"' }),
    ).toMatch(/Write the corrected sentence/);
    expect(recallPromptEs("sentence-production")).toMatch(/Write the corrected sentence/);
    expect(recallPromptEs("chunk-cloze")).toMatch(/gap/);
    expect(recallPromptEs("minimal-pair")).toMatch(/out loud/);
  });
});

describe("isTeachableCard", () => {
  it("una tarjeta cuya «corrección» fue un sinónimo no se repasa", () => {
    expect(isTeachableCard({ ...production, front: 'Corrige esta frase: "I finished the issues"', back: "I finished the tasks." })).toBe(false);
  });
  it("una corrección real sí", () => {
    expect(isTeachableCard(production)).toBe(true);
    expect(isTeachableCard(cloze)).toBe(true);
  });
  it("una tarjeta con marcador del modelo en la clave tampoco se repasa", () => {
    expect(
      isTeachableCard({ ...production, front: 'Corrige esta frase: "I need access to api key"', back: "I need the API key for [service]." }),
    ).toBe(false);
  });
  it("una tarjeta vieja de sólo puntuación o mayúsculas tampoco se repasa", () => {
    expect(isTeachableCard({ ...production, front: 'Corrige esta frase: "Yes, I am ready"', back: "Yes, I am ready." })).toBe(false);
  });
});
