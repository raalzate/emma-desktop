/**
 * Coherencia del trío afirmación / negación / pregunta de «Teach me» (#193).
 *
 * El "why": el modelo local, al pasar una Wh-question a afirmación, deja la
 * palabra interrogativa y el «?» («You did not do what yesterday?»). Una
 * tarjeta que enseña inglés agramatical es peor que no mostrar el trío, así que
 * aquí se rechazan los errores de forma que sí se pueden detectar sin un
 * analizador: signo final, presencia de la negación y el verbo en pasado tras
 * do/does/did. Dominio puro.
 */

import type { GrammarExample } from "./teaching-models";

const DO_SUPPORT = new Set(["do", "does", "did", "don't", "doesn't", "didn't"]);
// Verbos base que terminan en -ed: no son pasado.
const BASE_ENDING_IN_ED = new Set([
  "need", "feed", "seed", "breed", "bleed", "speed", "proceed", "succeed", "exceed", "shed",
]);
const NEGATION = /\b(?:not|never)\b|n['’]t\b/i;

const endsWithQuestionMark = (s: string): boolean => s.trim().endsWith("?");
const isNegated = (s: string): boolean => NEGATION.test(s);

/** «did not fixed», «Did you fixed?»: tras el auxiliar do va la forma base. */
function pastAfterDoSupport(example: GrammarExample): boolean {
  const hasDo = example.verbs.some(
    (v) => v.role === "auxiliary" && DO_SUPPORT.has(v.text.toLowerCase().replace("’", "'")),
  );
  if (!hasDo) return false;
  return example.verbs.some((v) => {
    const word = v.text.toLowerCase();
    return v.role === "main" && word.endsWith("ed") && !BASE_ENDING_IN_ED.has(word);
  });
}

function formIsCoherent(example: GrammarExample): boolean {
  if (pastAfterDoSupport(example)) return false;
  switch (example.form) {
    case "affirmative":
      return !endsWithQuestionMark(example.english) && !isNegated(example.english);
    case "negative":
      return !endsWithQuestionMark(example.english) && isNegated(example.english);
    case "question":
      return endsWithQuestionMark(example.english);
  }
}

/** true si las tres formas se pueden mostrar sin enseñar un error. */
export function isCoherentTrio(examples: GrammarExample[]): boolean {
  return examples.every(formIsCoherent);
}
