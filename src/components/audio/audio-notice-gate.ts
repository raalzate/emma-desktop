/**
 * Cuándo mostrar el aviso de privacidad del audio (FR-023): la primera vez que
 * se guarda un clip y sólo si las preferencias no dicen que ya se vio. Puro,
 * con las preferencias inyectadas; tolera que el almacén falle.
 */

import { shouldShowAudioNotice } from "@/domain/audio/audio-privacy-notice";
import type { AudioFacade } from "@/interface/audio-facade";

export interface AudioNoticeGate {
  /** Avisa que un clip se guardó con éxito. */
  clipSaved(): Promise<void>;
  /** El aprendiz cerró el aviso: se recuerda y no vuelve. */
  dismiss(): Promise<void>;
  visible(): boolean;
  subscribe(listener: (visible: boolean) => void): () => void;
}

export function createAudioNoticeGate(prefs: Pick<AudioFacade, "getPrefs" | "savePrefs">): AudioNoticeGate {
  let visible = false;
  let settled = false; // ya se decidió en esta sesión: no se relee en cada clip
  const listeners = new Set<(v: boolean) => void>();
  const set = (v: boolean) => {
    if (v === visible) return;
    visible = v;
    listeners.forEach((l) => l(v));
  };

  return {
    async clipSaved() {
      if (settled) return;
      try {
        settled = true;
        set(shouldShowAudioNotice(await prefs.getPrefs()));
      } catch {
        // Sin preferencias legibles no se molesta al aprendiz.
      }
    },
    async dismiss() {
      set(false);
      try {
        await prefs.savePrefs({ ...(await prefs.getPrefs()), noticeSeen: true });
      } catch {
        // Si no se pudo persistir, reaparecerá la próxima sesión: aceptable.
      }
    },
    visible: () => visible,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
