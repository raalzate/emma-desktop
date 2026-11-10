/**
 * Guarda el intento de lectura de una tarjeta de audio (FR-014) al terminarla.
 * Puro respecto de la UI: recibe la fachada de audio por argumento y nunca
 * lanza (un fallo del disco no debe impedir calificar la tarjeta).
 */

import type { AudioFacade } from "@/interface/audio-facade";
import type { SrsCard } from "@/domain/srs/srs-card";
import type { RecordedAttempt } from "@/components/practice/use-clip-recorder";

export async function saveReadingAttempt(
  audio: Pick<AudioFacade, "recordAttempt">,
  card: Pick<SrsCard, "id" | "back">,
  attempt: Pick<RecordedAttempt, "data" | "durationMs"> | null,
): Promise<string | null> {
  if (!attempt) return null;
  try {
    return await audio.recordAttempt({
      cardId: card.id,
      text: card.back,
      data: attempt.data,
      durationMs: attempt.durationMs,
    });
  } catch {
    return null;
  }
}
