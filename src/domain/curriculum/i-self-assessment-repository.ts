/** Contrato de persistencia para los ids marcados en la autoevaluación A1→B2. */

export interface ISelfAssessmentRepository {
  loadChecked(): Promise<string[]>;
  saveChecked(ids: string[]): Promise<void>;
}
