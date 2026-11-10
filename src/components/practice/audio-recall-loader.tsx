"use client";

/**
 * Contenedor de la tarjeta de audio en el repaso: carga el clip de referencia
 * con `runtime.audio.load` como URL de objeto (se revoca al desmontar), cablea
 * el reproductor y el grabador reales y, al terminar, guarda el intento de
 * lectura. Sin clip (borrado o perdido) `AudioRecallCard` degrada a texto.
 * Cableado fino: se verifica por CDP en la app real.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioRecallCard, type ClipRecorder } from "@/components/practice/audio-recall-card";
import { createClipPlayer } from "@/components/practice/clip-player";
import { useClipRecorder, type RecordedAttempt } from "@/components/practice/use-clip-recorder";
import { saveReadingAttempt } from "@/components/practice/audio-review-attempt";
import { CLIP_MIME } from "@/domain/audio/audio-clip";
import type { RecallVerdict } from "@/domain/srs/recall-check";
import type { SrsCard } from "@/domain/srs/srs-card";
import type { AudioFacade } from "@/interface/audio-facade";

/** `undefined` = cargando; `null` = sin clip. */
function useClipUrl(audio: AudioFacade, audioId: string | undefined): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    setUrl(undefined);
    void (async () => {
      const clip = audioId ? await audio.load(audioId).catch(() => null) : null;
      if (!alive) return;
      if (clip) {
        const blob = new Blob([clip.data as BlobPart], { type: CLIP_MIME });
        objectUrl = URL.createObjectURL(blob);
      }
      setUrl(objectUrl);
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [audio, audioId]);
  return url;
}

interface Props {
  card: SrsCard;
  audio: AudioFacade;
  onGrade: (correct: boolean, verdict: RecallVerdict) => void;
}

export function AudioRecallLoader({ card, audio, onGrade }: Props) {
  const clipUrl = useClipUrl(audio, card.audioId);
  const player = useMemo(createClipPlayer, []);
  const attemptRecorder = useClipRecorder();
  const lastAttempt = useRef<RecordedAttempt | null>(null);
  useEffect(() => () => player.stop(), [player]);

  // El envoltorio recuerda los bytes del último intento para guardarlos al terminar.
  const recorder: ClipRecorder = useMemo(
    () => ({
      start: () => attemptRecorder.start(),
      stop: async () => {
        const attempt = await attemptRecorder.stop();
        lastAttempt.current = attempt;
        return attempt;
      },
    }),
    [attemptRecorder],
  );

  if (clipUrl === undefined) return <p className="text-sm text-muted-foreground">Loading audio…</p>;

  return (
    <AudioRecallCard
      card={card}
      clipUrl={clipUrl}
      player={player}
      recorder={recorder}
      onGrade={(correct, verdict) => {
        void saveReadingAttempt(audio, card, lastAttempt.current).finally(() => onGrade(correct, verdict));
      }}
    />
  );
}
