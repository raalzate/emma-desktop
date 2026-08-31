/**
 * Conversación de chat persistida: una simulación con Emma que el aprendiz puede
 * retomar. El aprendiz puede tener varias (distintas simulaciones) y gestionarlas
 * (renombrar, eliminar). El audio de las notas de voz NO persiste (URLs de sesión);
 * sí la transcripción, que es lo que la IA procesa.
 */

import type { ChatTurn } from "./simulation-session";

export interface ChatConversation {
  id: string;
  title: string;
  scenarioType: string;
  situationTitle?: string;
  level: string;
  messages: ChatTurn[];
  turnCount: number;
  /** La escena se completó y la lección fue entregada (sesión de solo lectura). */
  completed?: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Título por defecto a partir del primer mensaje del aprendiz, o el del escenario. */
export function deriveTitle(fallback: string, messages: ChatTurn[]): string {
  const firstUser = messages.find((m) => m.role === "user")?.content?.trim();
  if (!firstUser) return fallback;
  return firstUser.length > 40 ? `${firstUser.slice(0, 40)}…` : firstUser;
}

/** Descarta campos no serializables (audioUrl de sesión) antes de guardar. */
export function stripForStorage(messages: ChatTurn[]): ChatTurn[] {
  return messages.map(({ role, content, at }) => ({ role, content, at }));
}
