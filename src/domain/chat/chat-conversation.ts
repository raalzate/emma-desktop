/**
 * Conversación de chat persistida: una simulación con Emma que el aprendiz puede
 * retomar. El aprendiz puede tener varias (distintas simulaciones) y gestionarlas
 * (renombrar, eliminar). El audio de las notas de voz NO persiste (URLs de sesión);
 * sí la transcripción, que es lo que la IA procesa.
 */

import { CEFR_LADDER, isCefrLevel, type CefrLevel } from "@/domain/cefr/cefr-ladder";
import { isSessionLesson, type SessionLesson } from "@/domain/feedback/session-lesson";
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
  /** Lección de cierre tal como Emma la entregó (no se regenera al reabrir). */
  lesson?: SessionLesson;
  /** El aprendiz declaró que no puede hablar: los turnos hablados quedan abiertos (#169). */
  voiceOptOut?: boolean;
  /** Archivada al subir de nivel: solo lectura, agrupada por nivel (FR-008). */
  archived?: { level: CefrLevel; at: string };
  createdAt: number;
  updatedAt: number;
}

/**
 * Lección guardada de una conversación, validada en el borde: lo que viene del
 * almacén JSON puede ser de una versión anterior o estar corrupto, y en ese caso
 * la sesión debe comportarse como si no tuviera lección (se regenera) en vez de
 * romper el diálogo con un reporte a medias.
 */
export function readStoredLesson(
  conversation: { lesson?: unknown } | null | undefined,
): SessionLesson | null {
  const stored = conversation?.lesson;
  return isSessionLesson(stored) ? stored : null;
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

/** `archived` validado en el borde: lo mal formado se ignora (como si no estuviera archivada). */
export function readArchived(
  conversation: { archived?: unknown } | null | undefined,
): { level: CefrLevel; at: string } | null {
  const a = conversation?.archived;
  if (typeof a !== "object" || a === null) return null;
  const { level, at } = a as { level?: unknown; at?: unknown };
  if (!isCefrLevel(level) || typeof at !== "string" || at === "") return null;
  return { level, at };
}

/** Conversación leída del almacén con `archived` saneado. */
export function sanitizeConversation(conversation: ChatConversation): ChatConversation {
  const { archived: _raw, ...rest } = conversation;
  const archived = readArchived(conversation);
  return archived ? { ...rest, archived } : rest;
}

/**
 * Marca como archivadas las conversaciones no archivadas cuyo nivel es `fromLevel`
 * o anterior. Las demás se devuelven tal cual (misma referencia).
 */
export function archiveForLevelUp(
  conversations: ChatConversation[],
  fromLevel: CefrLevel,
  now: string,
): ChatConversation[] {
  const limit = CEFR_LADDER.indexOf(fromLevel);
  return conversations.map((c) => {
    if (c.archived || !isCefrLevel(c.level)) return c;
    if (CEFR_LADDER.indexOf(c.level) > limit) return c;
    return { ...c, archived: { level: c.level, at: now } };
  });
}

export interface ArchivedGroup {
  level: CefrLevel;
  conversations: ChatConversation[];
}

/** Archivadas agrupadas por nivel, en el orden del escalafón. */
export function groupArchivedByLevel(conversations: ChatConversation[]): ArchivedGroup[] {
  return CEFR_LADDER.map((level) => ({
    level,
    conversations: conversations.filter((c) => c.archived?.level === level),
  })).filter((g) => g.conversations.length > 0);
}
