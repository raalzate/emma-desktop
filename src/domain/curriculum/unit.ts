/**
 * Unidad del currículo «English for Software Engineers» (libro fuente).
 *
 * El "why": cada unidad del libro es la fuente pedagógica de una o más
 * dinámicas de EMMA (escenarios, chunks para coaching, trampas para el
 * corrector, retos para el cierre de sesión). Dominio puro: solo tipos.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

// Bloque léxico prefabricado (Pilar 6, enfoque léxico): se recupera entero.
export interface UnitChunk {
  text: string;
  // Función comunicativa en español (p. ej. "pedir aclaración sin sonar brusco").
  functionEs: string;
}

// Error predecible por transferencia ES→EN ("Trampas del hispanohablante").
export interface LearnerTrap {
  wrong: string;
  right: string;
  noteEs?: string;
}

export type ChallengeMode = "written" | "oral" | "real-work" | "memorization";

// Reto (paso 7, output forzado): numeración global 1–72 del libro.
export interface UnitChallenge {
  id: number;
  instructionsEs: string;
  // Criterios contables/verificables (rúbrica del libro).
  criteria: string[];
  mode: ChallengeMode;
}

export interface CurriculumUnit {
  number: number; // 1–26
  title: string;
  cefrLevel: CefrLevel;
  // Escenario laboral que abre la unidad (paso 1, en español).
  scenarioEs: string;
  // Meta comunicativa (en español).
  goalEs: string;
  // Focos gramaticales/discursivos del paso Notice.
  grammarFocus: string[];
  // Foco fonético del paso Sound.
  soundFocus: string;
  chunks: UnitChunk[];
  traps: LearnerTrap[];
  challenges: UnitChallenge[];
  // Escenarios EMMA (scenarioType) donde se practica esta unidad.
  scenarioTypes: string[];
}
