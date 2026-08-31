/**
 * Acceso al banco de frases (Apéndice G) por situación. Mismo patrón que
 * `scenario-catalog.ts`: dominio puro que reimporta el dato de `lib`.
 */

import type { PhraseBankEntry } from "@/domain/reference/reference";
import { PHRASE_BANK } from "@/lib/reference-data/phrase-bank";

export function phrasesForSituation(
  situation: PhraseBankEntry["situation"] | undefined,
): PhraseBankEntry[] {
  if (!situation) return [];
  return PHRASE_BANK.filter((p) => p.situation === situation);
}
