/**
 * Aviso de privacidad del audio (FR-023): se muestra una sola vez, la primera
 * vez que se guarda un clip. Texto de producto en inglés.
 */

export interface AudioPrefsNotice {
  noticeSeen?: boolean;
}

export const AUDIO_NOTICE = {
  title: "Your voice stays on this device",
  body: "EMMA saves your voice notes and key phrases on this device only, to help you review by ear. Nothing is uploaded. You can delete them anytime in Settings.",
} as const;

export function shouldShowAudioNotice(prefs: AudioPrefsNotice | null | undefined): boolean {
  return prefs?.noticeSeen !== true;
}
