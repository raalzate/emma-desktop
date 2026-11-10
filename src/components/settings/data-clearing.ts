/**
 * Acciones de borrado de la zona de datos, sin React: reciben el borrado de
 * colecciones y el audio por argumento. El audio vive en disco aparte del
 * almacén JSON, así que borrar «todo» sin tocarlo dejaría las grabaciones.
 */

import type { AudioFacade } from "@/interface/audio-facade";

// Espeja STORE_KEYS (main/services/store-keys.ts); una prueba falla si se desalinean.
export const ALL_COLLECTIONS = [
  "profiles", "chatSettings", "progression", "errorStats", "pathway",
  "goals", "welcomeEvents", "sessions", "preferences", "chatConversations",
  "personaTunings", "srs", "challenges", "sessionMetrics", "lessonTodos",
  "gamification", "setupChecks", "audioPrefs",
];

export interface ClearingDeps {
  clear(keys: string[]): Promise<void>;
  audio: Pick<AudioFacade, "removeAll">;
}

export async function clearChatHistory(d: ClearingDeps): Promise<void> {
  await d.clear(["chatConversations"]);
  await d.audio.removeAll();
}

export async function deleteAllData(d: ClearingDeps): Promise<void> {
  await d.clear(ALL_COLLECTIONS);
  await d.audio.removeAll();
}
