/**
 * «Explain with Emma» en el drill de ejercicios: una llamada al puerto LLM por
 * ítem y respuesta, cacheada en memoria (el aprendiz vuelve a los ítems
 * fallados). Un fallo del modelo o una salida sin forma devuelve null: el
 * drill sigue, sólo se queda sin la explicación.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { ExerciseItem, UnitExercise } from "@/domain/exercises/exercise";
import {
  explanationPrompt,
  parseExplanation,
  type ItemExplanation,
} from "@/domain/exercises/item-explanation";
import { ITEM_EXPLANATION_MAX_TOKENS } from "@/domain/shared/token-budgets";

const cache = new Map<string, ItemExplanation | null>();

export async function explainExerciseItem(args: {
  llm: LlmGenerate;
  exercise: UnitExercise;
  item: ExerciseItem;
  given: string;
}): Promise<ItemExplanation | null> {
  const key = `${args.exercise.id}\u0000${args.item.stem}\u0000${args.given.trim().toLowerCase()}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  const { system, prompt } = explanationPrompt(args);
  let result: ItemExplanation | null = null;
  try {
    const raw = await args.llm({ prompt, system, maxTokens: ITEM_EXPLANATION_MAX_TOKENS });
    result = parseExplanation(raw);
  } catch {
    result = null;
  }
  // Un fallo no se cachea: la próxima vez puede salir bien.
  if (result) cache.set(key, result);
  return result;
}
