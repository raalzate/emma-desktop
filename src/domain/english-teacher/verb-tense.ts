/**
 * Tiempo verbal verificado de las tarjetas de «Teach me».
 *
 * El "why" (incidente 2026-11-25, en producción): la tarjeta etiquetó «You are
 * connecting the front and back end with the API» como «Presente simple». El
 * tiempo lo escribía el modelo como texto libre (`TENSE:`) y nada lo
 * verificaba: una tarjeta que enseña una regla falsa es peor que no mostrar
 * ninguna. Aquí se detecta el tiempo SÓLO cuando la forma es inequívoca
 * (auxiliar + -ing, have + participio, will, did…). Sin marca clara no se
 * adivina. Si la detección contradice al modelo, gana la detección.
 * Dominio puro.
 */

import type { GrammarExample, GrammarStructure } from "./teaching-models";

/** Palabras en -ing que tras «be» son adjetivos, no presente continuo. */
const ING_ADJECTIVES = new Set([
  "interesting", "amazing", "boring", "exciting", "confusing", "annoying", "surprising",
  "missing", "challenging", "frustrating", "disappointing", "outstanding", "promising",
  "worrying", "tiring", "charming", "willing", "thing", "nothing", "something", "anything", "everything",
]);

const IRREGULAR_PARTICIPLES =
  "been|done|gone|made|seen|said|had|got|gotten|built|sent|written|taken|given|known|found|" +
  "told|thought|brought|bought|left|lost|met|run|read|put|set|shown|spoken|broken|chosen|begun|drunk|eaten|fallen|felt|kept|paid|won";
const PARTICIPLE = `(?:\\w+ed|${IRREGULAR_PARTICIPLES})`;
const NOT = "(?:\\s+not)?";

const RULES: readonly [RegExp, string][] = [
  [new RegExp(`\\b(?:will|'ll|won't)${NOT}\\s+be\\s+\\w+ing\\b`), "futuro continuo"],
  [new RegExp(`\\b(?:will|'ll|won't)${NOT}\\s+\\w+`), "futuro simple"],
  [new RegExp(`\\b(?:am|is|are|'m|'re|'s|isn't|aren't)${NOT}\\s+going\\s+to\\s+\\w+`), "futuro con going to"],
  [new RegExp(`\\b(?:have|has|'ve|haven't|hasn't)${NOT}\\s+been\\s+\\w+ing\\b`), "presente perfecto continuo"],
  [new RegExp(`\\b(?:had|'d|hadn't)${NOT}\\s+been\\s+\\w+ing\\b`), "pasado perfecto continuo"],
  [new RegExp(`\\b(?:have|has|'ve|haven't|hasn't)${NOT}\\s+${PARTICIPLE}\\b`), "presente perfecto"],
  [new RegExp(`\\b(?:had|hadn't)${NOT}\\s+${PARTICIPLE}\\b`), "pasado perfecto"],
  [/\b(?:was|were|wasn't|weren't)(?:\s+not)?\s+(\w+ing)\b/, "pasado continuo"],
  [/\b(?:am|is|are|'m|'re|'s|isn't|aren't)(?:\s+not)?\s+(\w+ing)\b/, "presente continuo"],
  [/\b(?:did|didn't)\b/, "pasado simple"],
  [/\b(?:do|does|don't|doesn't)\b/, "presente simple"],
];

/** Captura en -ing de las reglas continuas (para filtrar adjetivos). */
function ingWordOf(sentence: string, rule: RegExp): string | null {
  const m = sentence.match(rule);
  if (!m) return null;
  const ing = m[0].split(/\s+/).pop() ?? "";
  return ing.endsWith("ing") ? ing : null;
}

function normalize(sentence: string): string {
  return sentence.toLowerCase().replace(/[’]/g, "'");
}

/** Tiempo verbal en español si la forma es inequívoca; null si no se puede afirmar. */
export function detectTense(sentence: string): string | null {
  const s = normalize(sentence);
  for (const [rule, tense] of RULES) {
    if (!rule.test(s)) continue;
    const ing = ingWordOf(s, rule);
    if (ing && ING_ADJECTIVES.has(ing)) continue;
    return tense;
  }
  return null;
}

/** Nombres de tiempos (es y en) que pueden aparecer en la etiqueta del modelo. */
const TENSE_NAMES =
  /\b(?:presente|pasado|futuro|present|past|future)\s+(?:perfecto\s+continuo|perfect\s+continuous|perfecto|perfect|simple|continuo|continuous|progresivo|progressive)\b/i;

const sameTense = (a: string | undefined, b: string): boolean =>
  (a ?? "").trim().toLowerCase() === b.toLowerCase();

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** En los tiempos continuos, «be» es auxiliar y el -ing es el verbo principal. */
function markContinuous(example: GrammarExample): GrammarExample {
  const ing = normalize(example.english).match(/\b(\w+ing)\b/)?.[1];
  if (!ing || ING_ADJECTIVES.has(ing)) return example;
  const original = example.english.match(new RegExp(`\\b${ing}\\b`, "i"))?.[0] ?? ing;
  const others = example.verbs.filter((v) => v.text.toLowerCase() !== ing);
  const verbs = others.map((v) => (v.role === "main" ? { ...v, role: "auxiliary" as const } : v));
  return { ...example, verbs: [...verbs, { text: original, role: "main" }] };
}

/**
 * Reconcilia el tiempo de la tarjeta con la forma real de su ejemplo: si la
 * detección contradice al modelo, corrige `tense`, la etiqueta y el marcado de
 * verbos. Sin detección inequívoca devuelve la tarjeta intacta.
 */
export function reconcileTense(card: GrammarStructure): GrammarStructure {
  // Sólo se corrige lo que el modelo AFIRMÓ (campo o etiqueta); no se agrega
  // un tiempo a una tarjeta que no lo trae.
  if (!card.tense && !TENSE_NAMES.test(card.label)) return card;
  const sentence = card.examples?.find((e) => e.form === "affirmative")?.english ?? card.example;
  const detected = detectTense(sentence);
  if (!detected || sameTense(card.tense, detected)) return card;
  const label = TENSE_NAMES.test(card.label) ? card.label.replace(TENSE_NAMES, capitalize(detected)) : card.label;
  const continuous = detected.includes("continuo");
  const examples = continuous ? card.examples?.map(markContinuous) : card.examples;
  return { ...card, tense: detected, label, ...(examples ? { examples } : {}) };
}
