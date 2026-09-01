"use client";

/**
 * Trae las 3 sugerencias de respuesta escalonadas (easy → mid → advanced) a
 * partir del último turno de Emma Y del borrador que el aprendiz lleva escrito:
 * si hay borrador, las sugerencias se alinean con su intención (FR-004/005).
 * El borrador se debouncea para no saturar el motor con cada tecla.
 */

import { useEffect, useState } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { ReplySuggestion } from "@/domain/coaching/reply-suggestion";

const DRAFT_DEBOUNCE_MS = 700;
// Borradores de menos de este largo no cambian la intención: se ignoran.
const MIN_DRAFT_CHARS = 4;

/** Valor debounced del borrador; vacío ↔ sin borrador (vuelve al modo base). */
function useDebouncedDraft(draft: string): string {
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const clean = draft.trim();
    const next = clean.length >= MIN_DRAFT_CHARS ? clean : "";
    if (next === "") {
      setDebounced("");
      return;
    }
    const t = setTimeout(() => setDebounced(next), DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft]);
  return debounced;
}

interface Args {
  runtime: EmmaRuntime;
  /**
   * Contexto COMPLETO de la escena (persona, situación, tema pendiente y lo que
   * el aprendiz ya dijo). Antes era sólo la última línea del agente, y sin saber
   * dónde estaba parada la conversación las sugerencias salían genéricas.
   */
  context: string;
  /** Sólo la última línea del agente: es contra ella que se mide el eco. */
  agentLine: string;
  level: CefrLevel;
  busy: boolean;
  draft?: string;
  /**
   * Escenario activo. Obligatorio a propósito: sin él `suggestReplies` no puede
   * anclar las sugerencias a la unidad del libro ni al banco de frases, y salen
   * genéricas en cualquier escena. Argumento con nombre por lo mismo — como
   * quinto posicional opcional se perdió sin que nada fallara.
   */
  scenarioType: string;
}

export function useSuggestions({
  runtime, context, agentLine, level, busy, draft = "", scenarioType,
}: Args) {
  const [suggestions, setSuggestions] = useState<ReplySuggestion[]>([]);
  const debouncedDraft = useDebouncedDraft(draft);

  useEffect(() => {
    let alive = true;
    setSuggestions([]);
    if (busy || !agentLine) return;
    runtime
      .suggest(context, level, debouncedDraft || undefined, scenarioType, agentLine)
      .then((s) => alive && setSuggestions(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [runtime, context, agentLine, level, busy, debouncedDraft, scenarioType]);

  return suggestions;
}
