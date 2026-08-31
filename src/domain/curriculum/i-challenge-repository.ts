/**
 * Contrato de persistencia de los retos del libro (paso 7 del ciclo, "output
 * forzado"): qué ids (1–72) están completados y qué texto entregó el usuario
 * para cada uno. Se guarda como una entrega por reto (sobrescribe si repite),
 * de forma simétrica al resto de repos del store JSON (`loadX`/`saveX`).
 */

export interface ChallengeSubmission {
  challengeId: number;
  text: string;
  // ISO 8601; permite mostrar "última entrega" sin lógica adicional.
  submittedAt: string;
}

export interface IChallengeRepository {
  loadCompleted(): Promise<number[]>;
  markCompleted(id: number): Promise<void>;
  /** Guarda (o reemplaza) el texto entregado para un reto. No lo marca completado. */
  saveSubmission(id: number, text: string): Promise<void>;
  loadSubmissions(): Promise<ChallengeSubmission[]>;
}
