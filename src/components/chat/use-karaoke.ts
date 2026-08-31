"use client";

/**
 * Karaoke de la nota de voz de Emma, por ORACIÓN (FR-010..013 de la spec 002).
 * Al motor de voz solo va el texto hablable (sin emojis/comillas/paréntesis);
 * la transcripción visible conserva el original. Voz principal: Edge-TTS (mp3 +
 * timings por palabra) con resaltado de la oración activa y clic-para-repetir
 * (seek al inicio de la oración). Fallback: Web Speech local, resaltado
 * best-effort sin seek. Sin autoplay.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speak, ttsAvailable, type KaraokeHandle } from "@/infrastructure/tts/web-speech-tts";
import { edgeTtsAvailable, synthesizeEdge } from "@/infrastructure/tts/edge-tts";
import type { WordTiming } from "@/domain/ai/llm-port";
import type { VoiceGender } from "@/domain/chat-settings/chat-settings";
import { hasSpeakableContent } from "@/domain/tts/speakable-text";
import {
  buildKaraokeScript,
  sentenceIndexAtWord,
  sentenceStartTime,
  sentenceEndTime,
  type SentenceSpan,
} from "@/domain/chat/transcript-sentences";

export interface Karaoke {
  /** Oraciones de la transcripción (texto original + rango hablable). */
  sentences: SentenceSpan[];
  /** Índice de la oración que está sonando, -1 si ninguna. */
  activeSentence: number;
  playing: boolean;
  loading: boolean;
  available: boolean;
  /** Con Edge (audio real) se puede saltar a una oración; con Web Speech no. */
  canSeek: boolean;
  play(): void;
  /** Reproduce desde el inicio de la oración i (repetible sin límite). */
  playSentence(i: number): void;
  stop(): void;
}

/** Índice de la palabra cuyo intervalo [start,end) contiene el tiempo t. */
function wordAt(timings: WordTiming[], t: number): number {
  for (let i = 0; i < timings.length; i++) if (t >= timings[i].start && t < timings[i].end) return i;
  return -1;
}

export function useKaraoke(text: string, gender?: VoiceGender, voiceId?: string): Karaoke {
  const script = useMemo(() => buildKaraokeScript(text), [text]);
  const [activeWord, setActiveWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canSeek, setCanSeek] = useState(false);
  const webHandle = useRef<KaraokeHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timingsRef = useRef<WordTiming[]>([]);
  // Frontera de reproducción: al reproducir UNA oración, el audio se detiene
  // al llegar a su fin (null = reproducir hasta el final del mensaje).
  const stopAtRef = useRef<number | null>(null);

  const speakable = hasSpeakableContent(text);

  const stop = useCallback(() => {
    webHandle.current?.stop();
    webHandle.current = null;
    audioRef.current?.pause();
    stopAtRef.current = null;
    setPlaying(false);
    setActiveWord(-1);
  }, []);

  const playWebSpeech = useCallback(() => {
    if (!ttsAvailable()) return setPlaying(false);
    setPlaying(true);
    webHandle.current = speak(script.speakText, {
      gender,
      onWord: setActiveWord,
      onEnd: () => (setPlaying(false), setActiveWord(-1)),
    });
  }, [script.speakText, gender]);

  // Sintetiza una sola vez por texto y cachea audio+timings (repetir = seek).
  const ensureAudio = useCallback(async (): Promise<HTMLAudioElement | null> => {
    if (audioRef.current) return audioRef.current;
    const { audioUrl, timings } = await synthesizeEdge(script.speakText, gender, voiceId);
    const audio = new Audio(audioUrl);
    timingsRef.current = timings;
    audio.ontimeupdate = () => {
      // Reproducción por oración: al cruzar la frontera se pausa ahí mismo.
      const boundary = stopAtRef.current;
      if (boundary !== null && audio.currentTime >= boundary) {
        audio.pause();
        stopAtRef.current = null;
        setPlaying(false);
        setActiveWord(-1);
        return;
      }
      setActiveWord(wordAt(timings, audio.currentTime));
    };
    audio.onended = () => (setPlaying(false), setActiveWord(-1));
    audioRef.current = audio;
    setCanSeek(true);
    return audio;
  }, [script.speakText, gender]);

  const playFrom = useCallback(
    async (startTime: number, stopAt: number | null = null) => {
      if (!edgeTtsAvailable()) return playWebSpeech();
      setLoading(true);
      try {
        const audio = await ensureAudio();
        if (!audio) return;
        stopAtRef.current = stopAt;
        audio.currentTime = startTime;
        setPlaying(true);
        await audio.play();
      } catch {
        playWebSpeech(); // sin red / fallo Edge → voz local
      } finally {
        setLoading(false);
      }
    },
    [ensureAudio, playWebSpeech],
  );

  const playSentence = useCallback(
    async (i: number) => {
      const sentence = script.sentences[i];
      if (!sentence || sentence.wordCount === 0) return;
      // Garantiza timings (primer clic sintetiza) y reproduce SOLO esa oración.
      if (!edgeTtsAvailable()) return playWebSpeech();
      setLoading(true);
      try {
        await ensureAudio();
      } catch {
        setLoading(false);
        return playWebSpeech();
      }
      setLoading(false);
      const start = sentenceStartTime(sentence, timingsRef.current);
      const end = sentenceEndTime(sentence, timingsRef.current);
      if (start === null) return;
      void playFrom(start, end);
    },
    [script.sentences, playFrom, ensureAudio, playWebSpeech],
  );

  useEffect(
    () => () => {
      webHandle.current?.stop();
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  return {
    sentences: script.sentences,
    activeSentence: sentenceIndexAtWord(script.sentences, activeWord),
    playing,
    loading,
    available: speakable && (edgeTtsAvailable() || ttsAvailable()),
    canSeek,
    play: () => void playFrom(0),
    playSentence,
    stop,
  };
}
