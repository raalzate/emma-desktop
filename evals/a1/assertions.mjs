/**
 * Aserción determinista de promptfoo: la respuesta pasa `checkA1Reply`
 * (dominio, con prueba en src/domain/cefr/__tests__/a1-reply-check.test.ts).
 */

import { checkA1Reply } from "./.build/emma-lib.mjs";

export default function a1Style(output) {
  const { ok, violations, metrics } = checkA1Reply(output);
  return {
    pass: ok,
    score: ok ? 1 : 0,
    reason: ok
      ? `A1 ok (${metrics.sentences} oraciones, máx. ${metrics.maxWordsPerSentence} palabras)`
      : `Viola A1: ${violations.join(", ")} — ${JSON.stringify(metrics)}`,
  };
}
