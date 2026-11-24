/**
 * Qué frases de EMMA se guardan como audio (Q4/FR-003): sólo las frases clave
 * de la franja SCENE y las correcciones del cierre, no todas sus respuestas.
 * Reutiliza `highlightScenePhrases` y `reportableCorrections` (misma definición
 * de "clave" y de "corrección" que el resto de la app).
 */

import { highlightScenePhrases } from "@/domain/chat/scene-highlights";
import type { NarrationBeat } from "@/domain/chat/scene-narration";
import { reportableCorrections, type SilentError } from "@/domain/chat/silent-error";
import { buildKaraokeScript } from "@/domain/chat/transcript-sentences";

export const MAX_SCENE_PHRASES = 4;
export const MAX_CORRECTION_PHRASES = 6;

export interface PhraseToKeep {
  text: string;
  source: "scene" | "correction";
}

export interface PhrasesToKeepInput {
  narration: readonly NarrationBeat[];
  personaName?: string;
  corrections: readonly SilentError[];
}

const normalize = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();

function hasKeyPhrase(sentence: string, names: string[]): boolean {
  return highlightScenePhrases(sentence, names).some((segment) => segment.key);
}

function sceneCandidates(narration: readonly NarrationBeat[], names: string[]): string[] {
  return narration
    .flatMap((beat) => buildKaraokeScript(beat.text).sentences.map((s) => s.text))
    .filter((sentence) => hasKeyPhrase(sentence, names));
}

export function phrasesToKeep(input: PhrasesToKeepInput): PhraseToKeep[] {
  const names = input.personaName ? [input.personaName] : [];
  const seen = new Set<string>();
  const take = (texts: string[], source: PhraseToKeep["source"], max: number): PhraseToKeep[] => {
    const kept: PhraseToKeep[] = [];
    for (const raw of texts) {
      const text = raw.trim();
      const key = normalize(text);
      if (kept.length >= max) break;
      if (!text || seen.has(key)) continue;
      seen.add(key);
      kept.push({ text, source });
    }
    return kept;
  };
  return [
    ...take(sceneCandidates(input.narration, names), "scene", MAX_SCENE_PHRASES),
    ...take(
      reportableCorrections(input.corrections).map((e) => e.corrected),
      "correction",
      MAX_CORRECTION_PHRASES,
    ),
  ];
}
