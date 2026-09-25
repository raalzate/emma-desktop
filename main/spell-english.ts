/**
 * Corrector ortográfico INGLÉS propio para el menú contextual.
 *
 * El "why" (incidente 2026-09-25): en macOS Electron usa el corrector del
 * sistema y `setSpellCheckerLanguages` es un no-op, así que con el sistema
 * en español el aprendiz escribía «soluction» y el menú le ofrecía
 * «solución, solicito, solicitan…». El atributo `lang="en"` tampoco cambia
 * nada (probado con un sondeo de Electron). La salida honesta es no depender
 * del SO para las sugerencias: un diccionario Hunspell en-US empaquetado
 * (`dictionary-en`) leído con `nspell` en el proceso main. El SO sigue
 * poniendo el subrayado; las sugerencias las pone EMMA, en inglés, en todas
 * las plataformas.
 */

import fs from 'node:fs';
import path from 'node:path';
import nspell from 'nspell';
import type { SpellCheckParams } from './context-menu';

export interface EnglishSpeller {
  correct(word: string): boolean;
  suggest(word: string): string[];
}

/**
 * `dictionary-en` es ESM puro (main es CommonJS) y su `exports` sólo publica
 * `index.js`: se resuelve esa entrada y se leen `.aff`/`.dic` de su carpeta.
 */
function dictionaryDir(): string {
  return path.dirname(require.resolve('dictionary-en'));
}

export function loadEnglishSpeller(): EnglishSpeller {
  const dir = dictionaryDir();
  const speller = nspell(
    fs.readFileSync(path.join(dir, 'index.aff')),
    fs.readFileSync(path.join(dir, 'index.dic'))
  );
  return {
    correct: (word) => speller.correct(word),
    suggest: (word) => speller.suggest(word),
  };
}

/**
 * Sustituye las sugerencias del SO por las del diccionario inglés. Si el SO
 * subrayó una palabra que en inglés es correcta, se marca `correctInEnglish`
 * para que el menú lo diga en vez de ofrecer "Sin sugerencias".
 */
export function toEnglishSpellParams(params: SpellCheckParams, speller: EnglishSpeller): SpellCheckParams {
  if (!params.misspelledWord) return params;
  const correctInEnglish = speller.correct(params.misspelledWord);
  return {
    ...params,
    correctInEnglish,
    dictionarySuggestions: correctInEnglish ? [] : speller.suggest(params.misspelledWord),
  };
}
