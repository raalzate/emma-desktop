/**
 * Puente entre la nota de voz del composer y el audio guardado (T27): formato
 * de grabación, guardado tolerante del clip y reparto del `audioId` en el turno.
 * Funciones puras o con el puerto inyectado: MediaRecorder real queda en el hook.
 */

import type { ChatTurn } from "@/domain/chat/simulation-session";
import type { AudioFacade } from "@/interface/audio-facade";

export { recorderOptionsFor, VOICE_BITRATE, VOICE_MIME } from "@/infrastructure/audio/clip-recorder-options";

/** Lo que el hook de voz entrega junto a la transcripción. */
export interface VoiceClip {
  blob: Blob;
  durationMs: number;
}

export type VoiceTurnSaver = Pick<AudioFacade, "saveLearnerTurn">;

export interface SaveVoiceTurnArgs {
  audio: VoiceTurnSaver;
  conversationId: string;
  turn: number;
  transcript: string;
  /** Ausente en un turno escrito. */
  clip: VoiceClip | undefined;
  onError?: (error: unknown) => void;
}

/** Guarda el clip del turno; nunca lanza: el audio es un extra, no frena la conversación. */
export async function saveVoiceTurn(a: SaveVoiceTurnArgs): Promise<string | null> {
  const transcript = a.transcript.trim();
  if (!a.clip || !transcript) return null;
  try {
    const data = new Uint8Array(await a.clip.blob.arrayBuffer());
    return await a.audio.saveLearnerTurn({
      conversationId: a.conversationId,
      turn: a.turn,
      transcript,
      data,
      durationMs: a.clip.durationMs,
    });
  } catch (error) {
    a.onError?.(error);
    return null;
  }
}

export function attachAudioId(messages: ChatTurn[], target: ChatTurn, audioId: string): ChatTurn[] {
  return messages.map((m) => (m === target ? { ...m, audioId } : m));
}

/** El turno N es el N-ésimo mensaje del aprendiz (mismo conteo que `turnCount`). */
export function clipsByTurn(messages: readonly ChatTurn[]): Record<number, string> {
  const out: Record<number, string> = {};
  let turn = 0;
  for (const m of messages) {
    if (m.role !== "user") continue;
    turn += 1;
    if (m.audioId) out[turn] = m.audioId;
  }
  return out;
}
