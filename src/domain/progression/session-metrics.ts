/**
 * Cálculo puro de las métricas de progreso medibles con lo que ya guardamos
 * de una sesión de chat (3 de las 5 del libro, ver progress-metrics.ts): la
 * velocidad de lectura y la comprensión auditiva no se derivan del chat de
 * texto y se autoevalúan manualmente (UI).
 */

import type { ChatTurn } from "@/domain/chat/simulation-session";
import type { SilentError } from "@/domain/chat/silent-error";
import { levelForMetric, type ProgressCefrLevel } from "./progress-metrics";

/** Métricas medidas de una sesión, listas para comparar contra los umbrales del libro. */
export interface SessionMetrics {
  /** Mediana de segundos entre el turno de EMMA y la respuesta del aprendiz. */
  responseLatencySeconds: number;
  /** Palabras del turno más largo del aprendiz (proxy de monólogo sostenido). */
  longestMonologueWords: number;
  /** Errores silenciosos por 100 palabras escritas por el aprendiz. */
  errorDensityPer100Words: number;
  /** Turnos del aprendiz en la sesión. */
  turns: number;
  /** Marca de tiempo (epoch ms) de cierre de la sesión, provista por el llamador. */
  at: number;
}

interface ComputeSessionMetricsArgs {
  messages: ChatTurn[];
  errors: SilentError[];
  at: number;
}

/** Cuenta las palabras de un texto (separadas por espacios en blanco). */
function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Mediana de los segundos entre cada turno de EMMA y la respuesta inmediata
 * del aprendiz. Se usa la mediana (no la media) para que un solo despiste
 * -una distracción puntual de 60s en medio de una sesión fluida- no domine
 * el resultado; la mediana refleja el ritmo típico de la sesión.
 */
function medianResponseLatencySeconds(messages: ChatTurn[]): number {
  const latencies: number[] = [];
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];
    if (prev.role !== "assistant" || curr.role !== "user") continue;
    if (prev.at === undefined || curr.at === undefined) continue;
    latencies.push((curr.at - prev.at) / 1000);
  }
  if (latencies.length === 0) return 0;

  const sorted = [...latencies].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Palabras del turno más largo del aprendiz (0 si no escribió nada). */
function longestMonologueWords(messages: ChatTurn[]): number {
  const userWordCounts = messages
    .filter((m) => m.role === "user")
    .map((m) => wordCount(m.content));
  return userWordCounts.length === 0 ? 0 : Math.max(...userWordCounts);
}

/** Errores por 100 palabras escritas por el aprendiz (0 si no escribió palabras). */
function errorDensity(messages: ChatTurn[], errors: SilentError[]): number {
  const totalWords = messages
    .filter((m) => m.role === "user")
    .reduce((sum, m) => sum + wordCount(m.content), 0);
  return totalWords === 0 ? 0 : (errors.length * 100) / totalWords;
}

/** Calcula las métricas de progreso de una sesión terminada. */
export function computeSessionMetrics({
  messages,
  errors,
  at,
}: ComputeSessionMetricsArgs): SessionMetrics {
  return {
    responseLatencySeconds: medianResponseLatencySeconds(messages),
    longestMonologueWords: longestMonologueWords(messages),
    errorDensityPer100Words: errorDensity(messages, errors),
    turns: messages.filter((m) => m.role === "user").length,
    at,
  };
}

/** Ids de progress-metrics.ts que las métricas de sesión sí pueden clasificar. */
export interface SessionMetricLevels {
  "response-latency": ProgressCefrLevel;
  "sustained-monologue": ProgressCefrLevel;
  "error-density": ProgressCefrLevel;
}

/**
 * Nivel MCER de cada métrica medible de la sesión, según los umbrales del
 * libro (progress-metrics.ts). El monólogo sostenido del libro se mide en
 * minutos hablando; aquí se usa el conteo de palabras del turno más largo
 * como proxy directo del mismo valor (no hay audio con duración en el chat
 * de texto), documentado como aproximación.
 */
export function metricLevels(m: SessionMetrics): SessionMetricLevels {
  return {
    "response-latency": levelForMetric("response-latency", m.responseLatencySeconds),
    "sustained-monologue": levelForMetric("sustained-monologue", m.longestMonologueWords),
    "error-density": levelForMetric("error-density", m.errorDensityPer100Words),
  };
}
