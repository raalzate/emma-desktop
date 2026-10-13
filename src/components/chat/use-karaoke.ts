"use client";

/**
 * Karaoke de la nota de voz de Emma, por ORACIÓN (FR-010..013 de la spec 002).
 * Al motor de voz solo va el texto hablable (sin emojis/comillas/paréntesis);
 * la transcripción visible conserva el original. Voz principal: neuronal
 * (Kokoro local; audio + timings por palabra) con resaltado de la oración activa y clic-para-repetir
 * (seek al inicio de la oración). El audio se sintetiza por trozos (primera
 * oración primero, ver `chunked-player`): suena sin esperar a todo el mensaje.
 * Fallback: Web Speech local, resaltado best-effort sin seek. Sin autoplay.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speak, ttsAvailable, type KaraokeHandle } from "@/infrastructure/tts/web-speech-tts";
import { neuralSpeechAvailable, synthesizeSpeech } from "@/infrastructure/tts/neural-speech";
import { createChunkedPlayer, type ChunkedPlayer } from "@/infrastructure/tts/chunked-player";
import { planSpeechChunks } from "@/domain/tts/speech-chunks";
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
  /** Índice GLOBAL de la palabra que está sonando, -1 si ninguna. */
  activeWord: number;
  playing: boolean;
  loading: boolean;
  available: boolean;
  /** Con audio real (Kokoro) se puede saltar a una oración; con Web Speech no. */
  canSeek: boolean;
  /** Motor que sonó: neuronal, "system" (Web Speech) o null antes de reproducir. */
  engine: "kokoro" | "system" | null;
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
  const [engine, setEngine] = useState<Karaoke["engine"]>(null);
  const webHandle = useRef<KaraokeHandle | null>(null);
  const playerRef = useRef<ChunkedPlayer | null>(null);

  const speakable = hasSpeakableContent(text);

  const stop = useCallback(() => {
    webHandle.current?.stop();
    webHandle.current = null;
    playerRef.current?.pause();
    setPlaying(false);
    setActiveWord(-1);
  }, []);

  const playWebSpeech = useCallback(() => {
    if (!ttsAvailable()) return setPlaying(false);
    setPlaying(true);
    setEngine("system");
    webHandle.current = speak(script.speakText, {
      gender,
      onWord: setActiveWord,
      onEnd: () => (setPlaying(false), setActiveWord(-1)),
    });
  }, [script.speakText, gender]);

  // Un reproductor por texto: sintetiza por trozos y cachea audio+timings
  // (repetir = seek). Resuelve cuando el PRIMER trozo está listo.
  const ensureAudio = useCallback(async (): Promise<ChunkedPlayer> => {
    if (!playerRef.current) {
      const player: ChunkedPlayer = createChunkedPlayer({
        chunks: planSpeechChunks(text),
        synthesize: (chunk) => synthesizeSpeech(chunk, gender, voiceId),
        createAudio: (url) => new Audio(url),
        onTime: (t) => setActiveWord(wordAt(player.timings(), t)),
        onStop: () => (setPlaying(false), setActiveWord(-1)),
        onBuffering: setLoading,
      });
      playerRef.current = player;
    }
    const player = playerRef.current;
    try {
      await player.ready();
    } catch (error) {
      player.dispose();
      if (playerRef.current === player) playerRef.current = null;
      throw error;
    }
    setCanSeek(true);
    setEngine(player.engine());
    return player;
  }, [text, gender, voiceId]);

  const playFrom = useCallback(
    async (startTime: number, stopAt: number | null = null) => {
      if (!neuralSpeechAvailable()) return playWebSpeech();
      setLoading(true);
      try {
        const player = await ensureAudio();
        setPlaying(true);
        await player.playFrom(startTime, stopAt);
      } catch {
        playWebSpeech(); // sin voz neuronal (o aún descargando Kokoro) → Web Speech
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
      if (!neuralSpeechAvailable()) return playWebSpeech();
      setLoading(true);
      let player: ChunkedPlayer;
      try {
        player = await ensureAudio();
        // La oración puede caer en un trozo que aún se sintetiza: se espera su fin.
        await player.untilWord(sentence.wordStart + sentence.wordCount - 1);
      } catch {
        setLoading(false);
        return playWebSpeech();
      }
      setLoading(false);
      const start = sentenceStartTime(sentence, player.timings());
      const end = sentenceEndTime(sentence, player.timings());
      if (start === null) return;
      void playFrom(start, end);
    },
    [script.sentences, playFrom, ensureAudio, playWebSpeech],
  );

  // El audio se cachea por texto: si el texto cambia (el mismo botón pasa a
  // otra palabra), se descarta el anterior. Si no, se oiría la palabra vieja
  // (gotcha del laboratorio de sonidos). También limpia al desmontar.
  useEffect(
    () => () => {
      webHandle.current?.stop();
      webHandle.current = null;
      playerRef.current?.dispose();
      playerRef.current = null;
      setPlaying(false);
      setActiveWord(-1);
      setCanSeek(false);
      setEngine(null);
    },
    [script.speakText, gender, voiceId],
  );

  return {
    sentences: script.sentences,
    activeSentence: sentenceIndexAtWord(script.sentences, activeWord),
    activeWord,
    playing,
    loading,
    available: speakable && (neuralSpeechAvailable() || ttsAvailable()),
    canSeek,
    engine,
    play: () => void playFrom(0),
    playSentence,
    stop,
  };
}
