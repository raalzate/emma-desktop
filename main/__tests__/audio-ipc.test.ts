import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudioStore } from '../services/audio-store';
import { createAudioHandlers, normalizeMicStatus } from '../services/audio-ipc';

let root: string;
const logged: unknown[] = [];
const bytes = () => new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2]);
const args = (id = 'a1', extra: Record<string, unknown> = {}) => ({
  meta: { id, origin: 'learner', text: 'hi', durationMs: 1000, bytes: 6, createdAt: 1, ...extra },
  mime: 'audio/webm;codecs=opus',
  data: bytes(),
});

function handlers(micStatus: () => string = () => 'granted') {
  return createAudioHandlers({
    store: createAudioStore(root),
    log: (...a: unknown[]) => logged.push(a),
    micStatus,
  });
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'emma-audio-ipc-'));
  logged.length = 0;
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe('audio-ipc · handlers', () => {
  it('save guarda y read lo devuelve', () => {
    const h = handlers();
    expect(h.save(args())).toEqual({ ok: true });
    expect(h.read('a1')?.meta.id).toBe('a1');
  });

  it('save con entrada inválida responde invalid y lo registra, sin lanzar', () => {
    const h = handlers();
    expect(h.save(args('../x'))).toEqual({ ok: false, error: 'invalid' });
    expect(h.save('basura')).toEqual({ ok: false, error: 'invalid' });
    expect(logged.length).toBe(2);
  });

  it('save responde io si el disco falla', () => {
    const store = createAudioStore(root);
    vi.spyOn(store, 'saveClip').mockImplementation(() => {
      throw new Error('disco lleno');
    });
    const h = createAudioHandlers({ store, log: () => {}, micStatus: () => 'granted' });
    expect(h.save(args())).toEqual({ ok: false, error: 'io' });
  });

  it('read con id inválido devuelve null en vez de lanzar', () => {
    expect(handlers().read('../x')).toBeNull();
  });

  it('remove con ids inválidos no borra nada y devuelve 0', () => {
    const h = handlers();
    h.save(args());
    expect(h.remove(['../a1'])).toEqual({ removed: 0 });
    expect(h.list()).toHaveLength(1);
  });

  it('remove, removeConversation, usage y removeAll', () => {
    const h = handlers();
    h.save(args('a1', { conversationId: 'c1' }));
    h.save(args('a2'));
    expect(h.usage()).toEqual({ count: 2, bytes: 12 });
    expect(h.removeConversation('c1')).toEqual({ removed: 1 });
    expect(h.removeConversation('../x')).toEqual({ removed: 0 });
    expect(h.remove(['a2'])).toEqual({ removed: 1 });
    h.save(args('a3'));
    expect(h.removeAll()).toEqual({ ok: true });
    expect(h.list()).toEqual([]);
  });

  it('micStatus normaliza lo que devuelve el SO', () => {
    expect(handlers(() => 'granted').micStatus()).toBe('granted');
    expect(handlers(() => 'raro').micStatus()).toBe('unknown');
    expect(
      handlers(() => {
        throw new Error('x');
      }).micStatus(),
    ).toBe('unknown');
  });

  it('normalizeMicStatus sólo deja pasar los valores conocidos', () => {
    for (const v of ['granted', 'denied', 'restricted', 'not-determined']) {
      expect(normalizeMicStatus(v)).toBe(v);
    }
    expect(normalizeMicStatus(undefined)).toBe('unknown');
  });
});
