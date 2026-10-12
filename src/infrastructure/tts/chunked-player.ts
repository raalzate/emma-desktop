/**
 * Reproductor de una nota de voz sintetizada por trozos (ver `planSpeechChunks`).
 * Sintetiza los trozos EN ORDEN (uno a la vez: el motor local es serial),
 * empieza a sonar en cuanto el primero está listo y encadena los demás. Expone
 * un tiempo GLOBAL (los timings de cada trozo van desplazados por la duración
 * acumulada), de modo que el karaoke sigue resaltando palabra y oración y
 * `playFrom(t)` sigue sirviendo para repetir una oración.
 *
 * Sin DOM: el audio y la síntesis entran por argumento (probable con falsos).
 */

import type { WordTiming } from "@/domain/ai/llm-port";
import { chunkIndexAtTime, offsetTimings, type SpeechChunk } from "@/domain/tts/speech-chunks";
import type { Speech, SpeechEngine } from "./speech-chain";

/** Lo mínimo que usamos de `HTMLAudioElement`. */
export interface PlayerAudio {
  currentTime: number;
  onended: ((event: Event) => void) | null;
  ontimeupdate: ((event: Event) => void) | null;
  play(): Promise<void>;
  pause(): void;
}

export interface ChunkedPlayerDeps {
  chunks: ReadonlyArray<SpeechChunk>;
  synthesize(text: string): Promise<Speech>;
  createAudio(url: string): PlayerAudio;
  /** Tiempo global (s) de la reproducción, para resaltar la palabra activa. */
  onTime(globalSec: number): void;
  /** La reproducción terminó (fin, frontera de oración o fallo de un trozo posterior). */
  onStop(): void;
  /** Se acabó lo sintetizado y el siguiente trozo aún no llega (true) o ya arrancó (false). */
  onBuffering(buffering: boolean): void;
}

export interface ChunkedPlayer {
  /** Resuelve con el primer trozo listo; rechaza si falla (usar Web Speech). */
  ready(): Promise<void>;
  /** Motor del primer trozo sintetizado; null si aún no hay audio. */
  engine(): SpeechEngine | null;
  /** Timings globales de los trozos ya sintetizados. */
  timings(): WordTiming[];
  /** Espera a que los timings cubran la palabra global i; rechaza si no llegará. */
  untilWord(i: number): Promise<void>;
  playFrom(startSec: number, stopAtSec: number | null): Promise<void>;
  pause(): void;
  dispose(): void;
}

interface Part {
  audio: PlayerAudio;
  offset: number;
  duration: number;
}

interface Waiter {
  word: number;
  resolve(): void;
  reject(error: Error): void;
}

export function createChunkedPlayer(deps: ChunkedPlayerDeps): ChunkedPlayer {
  const parts: Part[] = [];
  const timings: WordTiming[] = [];
  const waiters: Waiter[] = [];
  let started = false;
  let finished = false;
  let failure: Error | null = null;
  let disposed = false;
  let current = -1;
  let stopAt: number | null = null;
  let waitingNext = false;
  let engine: SpeechEngine | null = null;

  let resolveReady!: () => void;
  let rejectReady!: (error: Error) => void;
  const readyPromise = new Promise<void>((res, rej) => ((resolveReady = res), (rejectReady = rej)));
  readyPromise.catch(() => undefined); // el rechazo lo atiende quien llame a ready()

  const settleWaiters = () => {
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i];
      if (w.word < timings.length) {
        w.resolve();
        waiters.splice(i, 1);
      } else if (finished) {
        w.reject(failure ?? new Error("La palabra pedida queda fuera del audio"));
        waiters.splice(i, 1);
      }
    }
  };

  const stopPlayback = () => {
    waitingNext = false;
    deps.onBuffering(false);
    deps.onStop();
  };

  const startPart = async (index: number, from: number) => {
    const part = parts[index];
    parts.forEach((p, i) => i !== index && p.audio.pause());
    current = index;
    part.audio.currentTime = from;
    await part.audio.play();
  };

  const makePart = (speech: Speech): Part => {
    const audio = deps.createAudio(speech.audioUrl);
    const last = parts[parts.length - 1];
    const offset = last ? last.offset + last.duration : 0;
    const duration = speech.timings.length > 0 ? speech.timings[speech.timings.length - 1].end : 0;
    const index = parts.length;
    audio.ontimeupdate = () => {
      if (index !== current) return;
      const global = offset + audio.currentTime;
      if (stopAt !== null && global >= stopAt) {
        audio.pause();
        stopAt = null;
        return deps.onStop();
      }
      deps.onTime(global);
    };
    audio.onended = () => {
      if (index !== current) return;
      if (parts[index + 1]) return void startPart(index + 1, 0);
      if (finished) return deps.onStop();
      waitingNext = true;
      deps.onBuffering(true);
    };
    return { audio, offset, duration };
  };

  const run = async () => {
    for (const chunk of deps.chunks) {
      let speech: Speech;
      try {
        speech = await deps.synthesize(chunk.text);
      } catch (error) {
        if (disposed) return;
        failure = error instanceof Error ? error : new Error(String(error));
        if (parts.length === 0) rejectReady(failure);
        break;
      }
      if (disposed) return;
      engine ??= speech.engine;
      const part = makePart(speech);
      parts.push(part);
      timings.push(...offsetTimings(speech.timings, part.offset));
      if (parts.length === 1) resolveReady();
      settleWaiters();
      if (waitingNext) {
        waitingNext = false;
        deps.onBuffering(false);
        void startPart(parts.length - 1, 0);
      }
    }
    finished = true;
    if (parts.length === 0 && !failure) rejectReady(new Error("Sin texto para sintetizar"));
    settleWaiters();
    if (waitingNext) stopPlayback();
  };

  const start = () => {
    if (started) return;
    started = true;
    void run();
  };

  return {
    ready: () => (start(), readyPromise),
    engine: () => engine,
    timings: () => timings,
    untilWord(i) {
      start();
      return new Promise<void>((resolve, reject) => {
        waiters.push({ word: i, resolve, reject });
        settleWaiters();
      });
    },
    async playFrom(startSec, stopAtSec) {
      await this.ready();
      const index = chunkIndexAtTime(
        parts.map((p) => p.offset),
        startSec,
      );
      if (index < 0) return;
      stopAt = stopAtSec;
      waitingNext = false;
      await startPart(index, Math.max(startSec - parts[index].offset, 0));
    },
    pause() {
      parts[current]?.audio.pause();
      stopAt = null;
      waitingNext = false;
    },
    dispose() {
      disposed = true;
      parts.forEach((p) => p.audio.pause());
      stopAt = null;
      waitingNext = false;
    },
  };
}
