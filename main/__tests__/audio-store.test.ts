import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAudioStore, type AudioStoreService } from '../services/audio-store';
import type { AudioClipMetaWire } from '../services/audio-protocol';

let root: string;
let store: AudioStoreService;

const meta = (id: string, extra: Partial<AudioClipMetaWire> = {}): AudioClipMetaWire => ({
  id,
  origin: 'learner',
  text: 'hello there',
  durationMs: 1000,
  bytes: 6,
  createdAt: 1,
  ...extra,
});
const bytes = () => new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2]);
const clipsDir = () => path.join(root, 'audio', 'clips');

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'emma-audio-'));
  store = createAudioStore(root);
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe('audio-store · guardar y leer', () => {
  it('guarda un clip y lo lee con sus metadatos', () => {
    store.saveClip(meta('a1'), bytes());
    const clip = store.readClip('a1');
    expect(clip?.meta.id).toBe('a1');
    expect(Array.from(clip?.data ?? [])).toEqual(Array.from(bytes()));
    expect(fs.existsSync(path.join(clipsDir(), 'a1.webm'))).toBe(true);
  });

  it('devuelve null si el clip no existe', () => {
    expect(store.readClip('nada')).toBeNull();
  });

  it('guardar el mismo id sobrescribe sin duplicar en el índice', () => {
    store.saveClip(meta('a1', { text: 'uno' }), bytes());
    store.saveClip(meta('a1', { text: 'dos' }), bytes());
    expect(store.listClips()).toHaveLength(1);
    expect(store.readClip('a1')?.meta.text).toBe('dos');
  });

  it('no deja archivos temporales tras guardar', () => {
    store.saveClip(meta('a1'), bytes());
    const sobras = [...fs.readdirSync(clipsDir()), ...fs.readdirSync(path.join(root, 'audio'))].filter((f) =>
      f.endsWith('.tmp'),
    );
    expect(sobras).toEqual([]);
  });

  it('rechaza un id que escaparía del directorio (defensa en profundidad)', () => {
    expect(() => store.saveClip(meta('../fuera'), bytes())).toThrow();
    expect(() => store.readClip('../fuera')).toThrow();
  });
});

describe('audio-store · borrar y uso', () => {
  it('remove borra archivo e índice y cuenta sólo los realmente borrados', () => {
    store.saveClip(meta('a1'), bytes());
    store.saveClip(meta('a2'), bytes());
    expect(store.removeClips(['a1', 'no-existe'])).toBe(1);
    expect(store.readClip('a1')).toBeNull();
    expect(fs.existsSync(path.join(clipsDir(), 'a1.webm'))).toBe(false);
    expect(store.listClips().map((m) => m.id)).toEqual(['a2']);
  });

  it('removeByConversation borra sólo los de esa conversación', () => {
    store.saveClip(meta('a1', { conversationId: 'c1' }), bytes());
    store.saveClip(meta('a2', { conversationId: 'c2' }), bytes());
    expect(store.removeByConversation('c1')).toBe(1);
    expect(store.listClips().map((m) => m.id)).toEqual(['a2']);
  });

  it('removeAll deja el almacén vacío', () => {
    store.saveClip(meta('a1'), bytes());
    store.removeAll();
    expect(store.listClips()).toEqual([]);
    expect(fs.readdirSync(clipsDir())).toEqual([]);
  });

  it('usage suma conteo y bytes del índice', () => {
    store.saveClip(meta('a1', { bytes: 6 }), bytes());
    store.saveClip(meta('a2', { bytes: 6 }), bytes());
    expect(store.usage()).toEqual({ count: 2, bytes: 12 });
  });
});

describe('audio-store · reconcile (SC-002)', () => {
  it('borra archivos sin entrada y entradas sin archivo', () => {
    store.saveClip(meta('a1'), bytes());
    store.saveClip(meta('a2'), bytes());
    fs.writeFileSync(path.join(clipsDir(), 'huerfano.webm'), bytes());
    fs.writeFileSync(path.join(clipsDir(), 'resto.webm.tmp'), bytes());
    fs.rmSync(path.join(clipsDir(), 'a2.webm'));

    const r = store.reconcile();

    expect(r).toEqual({ orphanFiles: 2, missingFiles: 1 });
    expect(store.listClips().map((m) => m.id)).toEqual(['a1']);
    expect(fs.readdirSync(clipsDir())).toEqual(['a1.webm']);
  });

  it('un índice corrupto se trata como vacío y limpia los archivos', () => {
    store.saveClip(meta('a1'), bytes());
    fs.writeFileSync(path.join(root, 'audio', 'index.json'), '{rota');
    store.reconcile();
    expect(store.listClips()).toEqual([]);
    expect(fs.readdirSync(clipsDir())).toEqual([]);
  });

  it('con el directorio sin crear no falla', () => {
    expect(createAudioStore(path.join(root, 'nuevo')).reconcile()).toEqual({ orphanFiles: 0, missingFiles: 0 });
  });
});
