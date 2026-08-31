/** Repositorio de ajustes de personalidad sobre el almacén JSON. */

import {
  DEFAULT_CHAT_SETTINGS,
  normalizeChatSettings,
  type ChatSettings,
} from "@/domain/chat-settings/chat-settings";
import { readOne, writeOne } from "./store-client";

const KEY = "chatSettings";

/** Ajustes actuales (normalizados; por defecto si no hay guardados). */
export async function loadChatSettings(): Promise<ChatSettings> {
  const raw = await readOne<Partial<ChatSettings>>(KEY);
  return raw ? normalizeChatSettings(raw) : { ...DEFAULT_CHAT_SETTINGS };
}

export async function saveChatSettings(settings: ChatSettings): Promise<void> {
  await writeOne(KEY, normalizeChatSettings(settings));
}
