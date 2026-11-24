/**
 * Captura como audio las frases clave de EMMA (FR-003). Secuencial (Kokoro no
 * se paraleliza), abortable y tolerante: una frase que falla no corta las
 * demás y la tarjeta de dictado se crea igual; si el clip no existe, el repaso
 * la degrada a texto (FR-006, FR-009).
 */

import { emmaClipId, type AudioClipMeta } from "@/domain/audio/audio-clip";
import type { IAudioStore } from "@/domain/audio/i-audio-store";
import type { IPhraseVoicer, VoicedPhrase } from "@/domain/audio/i-phrase-voicer";
import type { PhraseToKeep } from "@/domain/audio/scene-phrases";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import { buildAudioRecallCard } from "@/domain/srs/srs-card";
import { addCards } from "@/application/srs/review-session-use-case";
import { saveClip } from "./save-clip-use-case";

export interface CaptureEmmaPhrasesArgs {
  store: IAudioStore;
  srs: ISrsRepository;
  voicer: IPhraseVoicer;
  phrases: readonly PhraseToKeep[];
  voiceKey: string;
  conversationId: string;
  now: number;
  today: number;
  capBytes: number;
  signal: AbortSignal;
  onError?: (error: unknown) => void;
}

export interface CaptureEmmaPhrasesResult {
  saved: number;
  deduped: number;
  failed: number;
}

async function knownIds(args: CaptureEmmaPhrasesArgs): Promise<Set<string>> {
  try {
    return new Set((await args.store.list()).map((c) => c.id));
  } catch (error) {
    args.onError?.(error);
    return new Set();
  }
}

async function synthesize(args: CaptureEmmaPhrasesArgs, text: string): Promise<VoicedPhrase | null> {
  try {
    return await args.voicer.voice(text, args.voiceKey);
  } catch (error) {
    args.onError?.(error);
    return null;
  }
}

async function ensureCard(args: CaptureEmmaPhrasesArgs, meta: Pick<AudioClipMeta, "id" | "text" | "origin">) {
  try {
    await addCards({ repo: args.srs, cards: [buildAudioRecallCard(meta, args.today)] });
  } catch (error) {
    args.onError?.(error);
  }
}

export async function captureEmmaPhrases(args: CaptureEmmaPhrasesArgs): Promise<CaptureEmmaPhrasesResult> {
  const result: CaptureEmmaPhrasesResult = { saved: 0, deduped: 0, failed: 0 };
  const known = await knownIds(args);

  for (const phrase of args.phrases) {
    if (args.signal.aborted) break;
    const text = phrase.text.trim();
    const id = emmaClipId(text, args.voiceKey);
    const meta = { id, text, origin: "emma" as const };

    if (known.has(id)) {
      result.deduped += 1;
      await ensureCard(args, meta);
      continue;
    }

    const voiced = await synthesize(args, text);
    if (args.signal.aborted) break;

    const saved =
      voiced !== null &&
      (
        await saveClip({
          store: args.store,
          srs: args.srs,
          clip: {
            meta: {
              ...meta,
              voice: args.voiceKey,
              conversationId: args.conversationId,
              durationMs: voiced.durationMs,
              bytes: voiced.data.byteLength,
              createdAt: args.now,
            },
            data: voiced.data,
          },
          capBytes: args.capBytes,
          onError: args.onError,
        })
      ).saved;

    if (saved) {
      known.add(id);
      result.saved += 1;
    } else {
      result.failed += 1;
    }
    await ensureCard(args, meta);
  }
  return result;
}
