/**
 * Tipos puros del material de referencia (Apéndices A–G del libro fuente).
 * Dominio sin IO: solo tipos e interfaces consumidos por los datos de
 * `src/lib/reference-data/`.
 */

export type VerbPattern =
  | "all-same"
  | "past-eq-participle"
  | "all-different"
  | "double-form";

export interface IrregularVerb {
  base: string;
  past: string;
  participle: string;
  ipa?: string;
  glossEs?: string;
  pattern: VerbPattern;
}

export interface PhrasalVerb {
  verb: string;
  particle: string;
  meaningEs: string;
  example: string;
}

export interface Collocation {
  text: string;
  category: string;
  noteEs?: string;
}

export interface FalseFriend {
  english: string;
  notMeaningEs: string;
  meaningEs: string;
  useInsteadEn: string;
}

export interface CommonError {
  id: number;
  wrong: string;
  right: string;
  categoryEs: string;
}

export interface GlossaryEntry {
  es: string;
  en: string;
  ipa: string;
  noteEs?: string;
}

export interface PhraseBankEntry {
  situation:
    | "standup"
    | "code_review"
    | "incident"
    | "meeting"
    | "interview"
    | "one_on_one"
    | "small_talk";
  functionEs: string;
  phrase: string;
}
