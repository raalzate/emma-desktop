/**
 * Adaptador real de `ClipPlayer` sobre `HTMLAudioElement` (con `playbackRate`).
 * Fino a propósito: no tiene lógica propia; se verifica por CDP en la app real.
 */

import type { ClipPlayer } from "@/components/practice/audio-recall-card";

export function createClipPlayer(): ClipPlayer {
  let audio: HTMLAudioElement | null = null;

  function stop() {
    if (!audio) return;
    audio.pause();
    audio = null;
  }

  return {
    play(url, rate) {
      stop();
      const next = new Audio(url);
      next.playbackRate = rate;
      audio = next;
      void next.play().catch(() => undefined);
    },
    stop,
  };
}
