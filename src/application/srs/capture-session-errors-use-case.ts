/**
 * Convierte los errores silenciosos de una sesión de práctica en tarjetas SRS
 * ("sentence-production") y las persiste. Orquesta buildCardsFromErrors
 * (dominio puro) con el puerto ISrsRepository (addCards), inyectado.
 */

import { buildCardsFromErrors } from "@/domain/srs/srs-card";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { SilentError } from "@/domain/chat/silent-error";
import { addCards } from "./review-session-use-case";

const DEFAULT_ID_PREFIX = "session-error";

/** Genera y persiste tarjetas SRS a partir de los errores de una sesión; devuelve cuántas se añadieron. */
export async function captureSessionErrors({
  repo,
  errors,
  today,
  idPrefix = DEFAULT_ID_PREFIX,
}: {
  repo: ISrsRepository;
  errors: SilentError[];
  today: number;
  idPrefix?: string;
}): Promise<number> {
  const cards = buildCardsFromErrors(errors, idPrefix, today);
  return addCards({ repo, cards });
}
