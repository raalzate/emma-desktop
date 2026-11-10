import { describe, expect, it } from 'vitest';
import {
  hasWebmMagic,
  parseClipId,
  parseConversationArgs,
  parseIdsArgs,
  parseSaveArgs,
} from '../services/audio-protocol';

const EBML = [0x1a, 0x45, 0xdf, 0xa3];

function webm(bytes = 10): Uint8Array {
  const data = new Uint8Array(bytes);
  data.set(EBML);
  return data;
}

function validArgs(overrides: Record<string, unknown> = {}, data: Uint8Array = webm()) {
  return {
    meta: {
      id: 'learner-chat-1-3',
      origin: 'learner',
      text: 'I went to the store',
      durationMs: 2000,
      bytes: data.byteLength,
      createdAt: 1_700_000_000_000,
      ...overrides,
    },
    mime: 'audio/webm;codecs=opus',
    data,
  };
}

describe('audio-protocol · cabecera WebM', () => {
  it('reconoce la cabecera EBML', () => {
    expect(hasWebmMagic(webm())).toBe(true);
  });
  it('rechaza bytes que no son WebM o son demasiado cortos', () => {
    expect(hasWebmMagic(new Uint8Array([1, 2, 3, 4, 5]))).toBe(false);
    expect(hasWebmMagic(new Uint8Array([0x1a, 0x45]))).toBe(false);
  });
});

describe('audio-protocol · parseSaveArgs', () => {
  it('acepta una entrada válida', () => {
    const parsed = parseSaveArgs(validArgs());
    expect(parsed.meta.id).toBe('learner-chat-1-3');
    expect(parsed.data.byteLength).toBe(10);
  });

  it.each([
    ['../evil', 'subida de directorio'],
    ['a/b', 'barra'],
    ['a\\b', 'barra invertida'],
    ['c:evil', 'dos puntos'],
    ['Mayus', 'mayúsculas'],
    ['', 'vacío'],
    ['a'.repeat(97), 'más de 96'],
  ])('rechaza el id %j (%s)', (id) => {
    expect(() => parseSaveArgs(validArgs({ id }))).toThrow();
  });

  it('rechaza un mime ajeno', () => {
    expect(() => parseSaveArgs({ ...validArgs(), mime: 'audio/wav' })).toThrow();
  });

  it('rechaza más de 60 s', () => {
    expect(() => parseSaveArgs(validArgs({ durationMs: 60_001 }))).toThrow();
  });

  it('rechaza un origen desconocido', () => {
    expect(() => parseSaveArgs(validArgs({ origin: 'otro' }))).toThrow();
  });

  it('rechaza claves de meta no previstas', () => {
    expect(() => parseSaveArgs(validArgs({ path: '/etc/passwd' }))).toThrow();
  });

  it('rechaza bytes declarados distintos al tamaño real', () => {
    expect(() => parseSaveArgs(validArgs({ bytes: 999 }))).toThrow();
  });

  it('rechaza más de 1,5 MB', () => {
    const big = webm(1_500_001);
    expect(() => parseSaveArgs(validArgs({}, big))).toThrow();
  });

  it('rechaza datos que no son WebM', () => {
    expect(() => parseSaveArgs(validArgs({}, new Uint8Array(10)))).toThrow();
  });

  it('rechaza data que no es Uint8Array', () => {
    expect(() => parseSaveArgs({ ...validArgs(), data: 'texto' })).toThrow();
  });
});

describe('audio-protocol · otros argumentos', () => {
  it('parseClipId rechaza rutas', () => {
    expect(parseClipId('emma-abc')).toBe('emma-abc');
    expect(() => parseClipId('../x')).toThrow();
  });
  it('parseIdsArgs valida cada id y el tope', () => {
    expect(parseIdsArgs(['a', 'b'])).toEqual(['a', 'b']);
    expect(() => parseIdsArgs(['a', '../b'])).toThrow();
    expect(() => parseIdsArgs(Array.from({ length: 5001 }, () => 'a'))).toThrow();
    expect(() => parseIdsArgs('a')).toThrow();
  });
  it('parseConversationArgs acepta ids simples y rechaza rutas', () => {
    expect(parseConversationArgs('conv_1')).toBe('conv_1');
    expect(() => parseConversationArgs('../x')).toThrow();
    expect(() => parseConversationArgs('')).toThrow();
  });
});
