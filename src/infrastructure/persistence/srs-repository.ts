/**
 * Repositorio de tarjetas SRS sobre el almacén JSON.
 *
 * No hay precedente de validación con Zod en los demás repos de esta carpeta
 * (todos confían en el shape guardado por la propia app), así que por
 * consistencia se usan guard clauses mínimas al cargar: descarta entradas que
 * no sean objetos válidos o les falten campos requeridos, en vez de lanzar,
 * ya que el origen es disco local y un dato corrupto no debe romper la app.
 */

import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { SrsCard, SrsCardKind } from "@/domain/srs/srs-card";
import { readOne, writeOne } from "./store-client";

const KEY = "srs";

const VALID_KINDS: readonly SrsCardKind[] = [
  "chunk-cloze",
  "sentence-production",
  "minimal-pair",
  "word-stress",
  "collocation",
  "audio-recall",
];

/** Valida el shape mínimo de una tarjeta SRS leída de disco. */
function isValidSrsCard(value: unknown): value is SrsCard {
  if (typeof value !== "object" || value === null) return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" &&
    typeof card.box === "number" &&
    typeof card.lastReviewedDay === "number" &&
    typeof card.kind === "string" &&
    VALID_KINDS.includes(card.kind as SrsCardKind) &&
    typeof card.front === "string" &&
    typeof card.back === "string"
  );
}

/**
 * Los campos de audio son opcionales: si vienen mal tipados se descartan y la
 * tarjeta se conserva (sin clip degrada a texto). Tarjetas viejas: misma referencia.
 */
function sanitizeAudioFields(card: SrsCard): SrsCard {
  const { audioId, audioOrigin, ...rest } = card;
  if (audioId === undefined && audioOrigin === undefined) return card;
  if (typeof audioId !== "string" || audioId === "") return rest;
  const origin = audioOrigin === "learner" || audioOrigin === "emma" ? { audioOrigin } : {};
  return { ...rest, audioId, ...origin };
}

export function createSrsRepository(): ISrsRepository {
  return {
    async loadCards() {
      const stored = await readOne<unknown[]>(KEY);
      if (!Array.isArray(stored)) return [];
      return stored.filter(isValidSrsCard).map(sanitizeAudioFields);
    },
    async saveCards(cards) {
      await writeOne(KEY, cards);
    },
  };
}
