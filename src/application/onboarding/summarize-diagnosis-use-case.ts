/**
 * Lee las notas de error persistidas y las agrega para mostrarlas
 * (portado de summarize_diagnosis_use_case.py, FR-009).
 *
 * `notesFor` es el puerto de persistencia: dado un usuario devuelve la lista de
 * categorías de nota. La agregación es determinista y no usa LLM.
 */

import { summarize, type DiagnosisSummary } from "@/domain/onboarding/diagnosis-summary";

export type NotesFor = (userId: string) => Promise<string[]> | string[];

export class SummarizeDiagnosisUseCase {
  constructor(private readonly notesFor: NotesFor) {}

  async execute(userId: string): Promise<DiagnosisSummary> {
    return summarize(await this.notesFor(userId));
  }
}
