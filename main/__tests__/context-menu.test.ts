import { describe, it, expect, vi } from 'vitest';
import { buildContextMenuTemplate, type SpellCheckParams } from '../context-menu';

const baseParams: SpellCheckParams = {
  isEditable: true,
  misspelledWord: '',
  dictionarySuggestions: [],
  editFlags: { canCut: true, canCopy: true, canPaste: true },
};

const actions = () => ({ replaceMisspelling: vi.fn(), addToDictionary: vi.fn() });

const labels = (template: ReturnType<typeof buildContextMenuTemplate>) =>
  template.map((item) => item.label ?? item.role ?? item.type);

describe('buildContextMenuTemplate', () => {
  it('no ofrece menú fuera de un campo editable', () => {
    const template = buildContextMenuTemplate({ ...baseParams, isEditable: false }, actions());
    expect(template).toEqual([]);
  });

  it('pone las sugerencias del diccionario arriba, antes de las acciones de edición', () => {
    const template = buildContextMenuTemplate(
      { ...baseParams, misspelledWord: 'architech', dictionarySuggestions: ['architect', 'architects'] },
      actions()
    );
    expect(labels(template).slice(0, 2)).toEqual(['architect', 'architects']);
    expect(labels(template)).toContain('Agregar al diccionario');
  });

  it('aplica la sugerencia elegida sobre la palabra mal escrita', () => {
    const a = actions();
    const template = buildContextMenuTemplate(
      { ...baseParams, misspelledWord: 'architech', dictionarySuggestions: ['architect'] },
      a
    );
    template[0].click?.(undefined as never, undefined as never, undefined as never);
    expect(a.replaceMisspelling).toHaveBeenCalledWith('architect');
  });

  it('agrega la palabra al diccionario del usuario', () => {
    const a = actions();
    const template = buildContextMenuTemplate(
      { ...baseParams, misspelledWord: 'Bogotá', dictionarySuggestions: [] },
      a
    );
    const add = template.find((item) => item.label === 'Agregar al diccionario');
    add?.click?.(undefined as never, undefined as never, undefined as never);
    expect(a.addToDictionary).toHaveBeenCalledWith('Bogotá');
  });

  it('avisa cuando el diccionario no tiene sugerencias, en vez de callar', () => {
    const template = buildContextMenuTemplate(
      { ...baseParams, misspelledWord: 'qwerty', dictionarySuggestions: [] },
      actions()
    );
    const aviso = template.find((item) => item.label === 'Sin sugerencias');
    expect(aviso?.enabled).toBe(false);
  });

  it('corta la lista a 5 sugerencias: un menú largo tapa el composer', () => {
    const template = buildContextMenuTemplate(
      {
        ...baseParams,
        misspelledWord: 'architech',
        dictionarySuggestions: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      },
      actions()
    );
    expect(labels(template).slice(0, 6)).toEqual(['a', 'b', 'c', 'd', 'e', 'separator']);
  });

  it('sin palabra mal escrita deja sólo las acciones de edición', () => {
    const template = buildContextMenuTemplate(baseParams, actions());
    expect(labels(template)).toEqual(['Cortar', 'Copiar', 'Pegar', 'Seleccionar todo']);
  });

  it('deshabilita las acciones que el foco no permite', () => {
    const template = buildContextMenuTemplate(
      { ...baseParams, editFlags: { canCut: false, canCopy: false, canPaste: true } },
      actions()
    );
    const porEtiqueta = Object.fromEntries(template.map((i) => [i.label, i.enabled]));
    expect(porEtiqueta['Cortar']).toBe(false);
    expect(porEtiqueta['Copiar']).toBe(false);
    expect(porEtiqueta['Pegar']).toBe(true);
  });
});

describe('buildContextMenuTemplate · veredicto del diccionario inglés', () => {
  it('cuando la palabra es correcta en inglés lo dice en vez de "Sin sugerencias"', () => {
    const template = buildContextMenuTemplate(
      { ...baseParams, misspelledWord: 'deploy', dictionarySuggestions: [], correctInEnglish: true },
      actions()
    );
    expect(labels(template)).toContain('Correcta en inglés');
    expect(labels(template)).not.toContain('Sin sugerencias');
  });
});
