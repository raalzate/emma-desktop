/**
 * Política de redirección de práctica: decide qué sugerir a continuación a
 * partir del estado consolidado del aprendiz (categorías de error débiles,
 * unidad activa, tarjetas SRS pendientes). Determinista
 * y sin IO: cada regla se evalúa en orden de prioridad hasta llenar el cupo.
 */

import { getUnit } from "@/domain/curriculum/unit-catalog";
import type { ExerciseKind, UnitExercise } from "@/domain/exercises/exercise";
import { scenarioForError } from "@/domain/pathway/error-scenario-mapping";
import { EXERCISES_P1_U13 } from "@/lib/exercise-data/exercises-part1-u13";
import { EXERCISES_U14_26 } from "@/lib/exercise-data/exercises-u14-26";

const ALL_EXERCISES: readonly UnitExercise[] = [...EXERCISES_P1_U13, ...EXERCISES_U14_26];

export type PracticeRecommendation =
  | { kind: "exercise"; exerciseId: string; unit: number; reasonEs: string }
  | { kind: "srs-review"; due: number; reasonEs: string }
  | { kind: "minimal-pair"; contrastId: string; reasonEs: string }
  | { kind: "scenario"; scenarioType: string; reasonEs: string };

export interface RecommendPracticeArgs {
  activeUnit: number | null;
  // Ordenadas de la más a la menos débil (mismo orden que TutorContext.weakErrorCategories).
  weakErrorCategories: string[];
  pendingSrsCards: number;
  maxRecommendations?: number;
}

const SRS_REVIEW_THRESHOLD = 5;
const DEFAULT_MAX_RECOMMENDATIONS = 5;

/**
 * Mapeo categoría de error (ErrorLabel, ver domain/chat/error-taxonomy) → tipo
 * de ejercicio (ExerciseKind) que mejor la ejercita:
 * - article/preposition → "fill" (completar el hueco con la palabra correcta).
 * - word_form           → "transform" (practicar la forma correcta de la palabra).
 * - word_order          → "order" (practicar el orden correcto de la frase).
 * - grammar/punctuation/capitalization/spacing → "correct" (detectar y corregir).
 */
const ERROR_TO_EXERCISE_KIND: Record<string, ExerciseKind> = {
  article: "fill",
  preposition: "fill",
  word_form: "transform",
  word_order: "order",
  grammar: "correct",
  punctuation: "correct",
  capitalization: "correct",
  spacing: "correct",
};

/** Contraste fonético por defecto cuando la unidad activa entrena /ɪ/ vs /iː/. */
const DEFAULT_MINIMAL_PAIR_CONTRAST_ID = "i-vs-ii";

/** Primer ejercicio de *unit* cuyo kind ataca *category*, o null si no hay match. */
function exerciseForUnitAndCategory(unit: number, category: string): UnitExercise | null {
  const kind = ERROR_TO_EXERCISE_KIND[category];
  if (!kind) return null;
  return ALL_EXERCISES.find((ex) => ex.unit === unit && ex.kind === kind) ?? null;
}

function srsRule(args: RecommendPracticeArgs): PracticeRecommendation | null {
  if (args.pendingSrsCards < SRS_REVIEW_THRESHOLD) return null;
  return {
    kind: "srs-review",
    due: args.pendingSrsCards,
    reasonEs: `${args.pendingSrsCards} cards due for review`,
  };
}

function exerciseRule(args: RecommendPracticeArgs): PracticeRecommendation | null {
  if (args.activeUnit === null) return null;
  for (const category of args.weakErrorCategories) {
    const exercise = exerciseForUnitAndCategory(args.activeUnit, category);
    if (exercise) {
      return {
        kind: "exercise",
        exerciseId: exercise.id,
        unit: exercise.unit,
        reasonEs: `weak in ${category} → exercise ${exercise.id} from unit ${exercise.unit}`,
      };
    }
  }
  return null;
}

/** True si el soundFocus de la unidad activa menciona el contraste /ɪ/ vs /iː/. */
function unitTrainsDefaultContrast(activeUnit: number | null): boolean {
  if (activeUnit === null) return false;
  const unit = getUnit(activeUnit);
  if (!unit) return false;
  return unit.soundFocus.includes("/ɪ/") || unit.soundFocus.includes("/iː/");
}

function minimalPairRule(args: RecommendPracticeArgs): PracticeRecommendation | null {
  if (!unitTrainsDefaultContrast(args.activeUnit)) return null;
  return {
    kind: "minimal-pair",
    contrastId: DEFAULT_MINIMAL_PAIR_CONTRAST_ID,
    reasonEs: "your active unit trains /ɪ/ vs /iː/: practice the minimal pair",
  };
}

function scenarioRule(args: RecommendPracticeArgs): PracticeRecommendation | null {
  for (const category of args.weakErrorCategories) {
    const scenarioType = scenarioForError(category);
    if (scenarioType) {
      return {
        kind: "scenario",
        scenarioType,
        reasonEs: `weak in ${category} → practice the "${scenarioType}" scenario`,
      };
    }
  }
  return null;
}

const RULES = [srsRule, exerciseRule, minimalPairRule, scenarioRule];

/**
 * Produce hasta *maxRecommendations* sugerencias, en orden de prioridad:
 * 1) repaso SRS si hay ≥5 tarjetas vencidas;
 * 2) ejercicio de la unidad activa que ataca la categoría de error más débil;
 * 3) par mínimo si la unidad activa entrena un contraste fonético reconocido;
 * 4) escenario que ejercita la categoría de error más débil.
 */
export function recommendPractice(args: RecommendPracticeArgs): PracticeRecommendation[] {
  const max = args.maxRecommendations ?? DEFAULT_MAX_RECOMMENDATIONS;
  const recommendations: PracticeRecommendation[] = [];

  for (const rule of RULES) {
    if (recommendations.length >= max) break;
    const recommendation = rule(args);
    if (recommendation) recommendations.push(recommendation);
  }

  return recommendations;
}
