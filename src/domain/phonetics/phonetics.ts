/**
 * Tipos puros del dominio de fonética (Parte 1 — El sistema de sonidos).
 * Modelan contrastes de fonemas, reglas de pronunciación, el protocolo de
 * shadowing y los retos de la Parte 1. Sin IO ni dependencias externas.
 */

export interface MinimalPair {
  a: string;
  b: string;
  ipaA?: string;
  ipaB?: string;
  noteEs?: string;
}

export interface SoundContrast {
  id: string;
  titleEs: string;
  phonemes: string[];
  explanationEs: string;
  pairs: MinimalPair[];
  practiceSentence?: string;
}

export interface PronunciationRule {
  id: string;
  titleEs: string;
  ruleEs: string;
  examples: { word: string; ipa?: string; noteEs?: string }[];
}

export interface ShadowingPhase {
  order: number;
  nameEs: string;
  actionEs: string;
  minutes: number;
}

export interface PhoneticChallenge {
  id: "A" | "B" | "C";
  instructionsEs: string;
}
