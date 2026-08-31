/**
 * Constructores de TeachingResult (éxito / error) fuera del orquestador para
 * mantener teach-use-case por debajo del límite de líneas.
 */

import { assembleTeaching } from "@/domain/english-teacher/teaching-markdown";
import type {
  GrammarStructure,
  PronunciationRow,
  ReplySuggestion,
  TeachingRequest,
  TeachingResult,
} from "@/domain/english-teacher/teaching-models";

export interface Sections {
  phonetics: PronunciationRow[];
  grammar: GrammarStructure[];
  replies: ReplySuggestion[];
}

export function successResult(
  request: TeachingRequest,
  sections: Sections,
  start: number,
): TeachingResult {
  return {
    originalText: request.text,
    teachingText: assembleTeaching(sections),
    explainLanguage: request.explainLanguage,
    latencyMs: Date.now() - start,
    status: "success",
    errorCode: null,
    cached: false,
    replySuggestions: sections.replies.map((r) => r.english),
    sections,
  };
}

export function errorResult(request: TeachingRequest, start: number): TeachingResult {
  return {
    originalText: request.text,
    teachingText: "",
    explainLanguage: request.explainLanguage,
    latencyMs: Date.now() - start,
    status: "error",
    errorCode: "TEACHING_SERVICE_UNAVAILABLE",
    cached: false,
    replySuggestions: [],
    sections: { phonetics: [], grammar: [], replies: [] },
  };
}
