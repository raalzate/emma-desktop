/**
 * Ejercicio cerrado del paso Practice (libro fuente) con su solucionario.
 *
 * El "why": el libro evalúa con ejercicios tipificados (completar, corregir,
 * traducir, ordenar, clasificar) cuyo solucionario (Apéndice I) permite
 * corrección determinista en la app, sin LLM. Dominio puro: solo tipos.
 */

export type ExerciseKind =
  | "fill" // completar hueco
  | "transform" // transformar estructura (p. ej. activa→pasiva)
  | "correct" // corregir el error
  | "translate" // traducir ES→EN (producción)
  | "order" // ordenar secuencia
  | "classify" // clasificar (p. ej. -ed en /t/ /d/ /ɪd/)
  | "choose"; // elegir opción/frase adecuada

export interface ExerciseItem {
  stem: string;
  // Respuesta modelo del solucionario; variantes válidas en altAnswers.
  answer: string;
  altAnswers?: string[];
  noteEs?: string;
}

export interface UnitExercise {
  // Id del libro: "1A", "10D", "P1.5" (Parte 1 usa unit 0).
  id: string;
  unit: number;
  kind: ExerciseKind;
  promptEs: string;
  items: ExerciseItem[];
}
