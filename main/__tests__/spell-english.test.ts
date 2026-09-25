import { describe, it, expect } from 'vitest';
import { loadEnglishSpeller, toEnglishSpellParams, type EnglishSpeller } from '../spell-english';
import type { SpellCheckParams } from '../context-menu';

const baseParams: SpellCheckParams = {
  isEditable: true,
  misspelledWord: '',
  dictionarySuggestions: [],
  editFlags: { canCut: true, canCopy: true, canPaste: true },
};

describe('loadEnglishSpeller (diccionario en-US empaquetado)', () => {
  const speller = loadEnglishSpeller();

  it('sugiere en inglés aunque el sistema esté en español (macOS ignora setSpellCheckerLanguages)', () => {
    const suggestions = speller.suggest('soluction');
    expect(suggestions[0]).toBe('solution');
    expect(suggestions.some((s) => /ó|ción/.test(s))).toBe(false);
  });

  it('reconoce palabras correctas, incluida jerga técnica común', () => {
    expect(speller.correct('architect')).toBe(true);
    expect(speller.correct('deployed')).toBe(true);
    expect(speller.correct('architech')).toBe(false);
  });
});

describe('toEnglishSpellParams', () => {
  const speller: EnglishSpeller = {
    correct: (w) => w === 'deploy',
    suggest: (w) => (w === 'soluction' ? ['solution', 'solutions'] : []),
  };

  it('reemplaza las sugerencias del SO por las del diccionario inglés', () => {
    const params = toEnglishSpellParams(
      { ...baseParams, misspelledWord: 'soluction', dictionarySuggestions: ['solución', 'solicito'] },
      speller
    );
    expect(params.dictionarySuggestions).toEqual(['solution', 'solutions']);
    expect(params.correctInEnglish).toBe(false);
  });

  it('marca como correcta en inglés la palabra que el SO subrayó por error', () => {
    const params = toEnglishSpellParams(
      { ...baseParams, misspelledWord: 'deploy', dictionarySuggestions: ['despliega'] },
      speller
    );
    expect(params.correctInEnglish).toBe(true);
    expect(params.dictionarySuggestions).toEqual([]);
  });

  it('sin palabra subrayada no toca nada', () => {
    expect(toEnglishSpellParams(baseParams, speller)).toEqual(baseParams);
  });
});
