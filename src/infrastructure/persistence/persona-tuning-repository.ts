/** Repositorio del tuning por protopersona (tono/actitud/estilo) sobre el almacén JSON. */

import {
  DEFAULT_PERSONA_TUNING,
  normalizePersonaTuning,
  type PersonaTuning,
} from "@/domain/personas/persona-tuning";
import { readOne, writeOne } from "./store-client";

const KEY = "personaTunings";

type TuningMap = Record<string, PersonaTuning>;

/** Mapa completo scenarioType → tuning (normalizado entrada por entrada). */
export async function loadPersonaTunings(): Promise<TuningMap> {
  const raw = await readOne<Record<string, unknown>>(KEY);
  if (!raw) return {};
  const out: TuningMap = {};
  for (const [key, value] of Object.entries(raw)) out[key] = normalizePersonaTuning(value);
  return out;
}

/** Tuning de un escenario (default si nunca se configuró). */
export async function loadPersonaTuning(scenarioType: string): Promise<PersonaTuning> {
  const all = await loadPersonaTunings();
  return all[scenarioType] ?? { ...DEFAULT_PERSONA_TUNING };
}

export async function savePersonaTuning(
  scenarioType: string,
  tuning: PersonaTuning,
): Promise<void> {
  const all = await loadPersonaTunings();
  all[scenarioType] = normalizePersonaTuning(tuning);
  await writeOne(KEY, all);
}
