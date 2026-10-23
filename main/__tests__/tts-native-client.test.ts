import { describe, it, expect, vi } from 'vitest';
import { createNativeTtsClient, type TtsChild } from '../services/tts-native/client';
import { parseGenerateArgs } from '../services/tts-native/protocol';

/** Proceso de voz falso: responde lo que el test decide y puede «morir». */
function fakeChild() {
  let onMessage: (m: unknown) => void = () => {};
  let onExit: (code: number) => void = () => {};
  const sent: { type: string; id: number; text?: string; voice?: string }[] = [];
  const child: TtsChild = {
    postMessage: (m) => void sent.push(m),
    onMessage: (cb) => void (onMessage = cb),
    onExit: (cb) => void (onExit = cb),
    kill: vi.fn(),
  };
  return {
    child,
    sent,
    reply: (m: unknown) => onMessage(m),
    die: (code = 1) => onExit(code),
  };
}

const wav = new Uint8Array([82, 73, 70, 70]);

describe('createNativeTtsClient', () => {
  it('no arranca el proceso hasta que se pide voz', () => {
    const spawn = vi.fn(() => fakeChild().child);
    createNativeTtsClient({ spawn });
    expect(spawn).not.toHaveBeenCalled();
  });

  it('warm carga el modelo y resuelve con ready', async () => {
    const f = fakeChild();
    const client = createNativeTtsClient({ spawn: () => f.child });
    const warm = client.warm();
    expect(f.sent[0]).toMatchObject({ type: 'load' });
    f.reply({ type: 'ready', id: f.sent[0].id });
    await expect(warm).resolves.toBeUndefined();
  });

  it('generate devuelve el WAV y la duración de su petición', async () => {
    const f = fakeChild();
    const client = createNativeTtsClient({ spawn: () => f.child });
    const job = client.generate('Hi there.', 'af_heart');
    const req = f.sent[0];
    expect(req).toMatchObject({ type: 'generate', text: 'Hi there.', voice: 'af_heart' });
    f.reply({ type: 'audio', id: req.id, wav, duration: 1.2 });
    await expect(job).resolves.toEqual({ wav, duration: 1.2 });
  });

  it('un error del proceso rechaza sólo esa petición', async () => {
    const f = fakeChild();
    const client = createNativeTtsClient({ spawn: () => f.child });
    const job = client.generate('Hi.', 'af_heart');
    f.reply({ type: 'error', id: f.sent[0].id, message: 'onnx roto' });
    await expect(job).rejects.toThrow('onnx roto');
  });

  it('si el proceso muere rechaza lo pendiente y la próxima petición lo vuelve a lanzar', async () => {
    const first = fakeChild();
    const second = fakeChild();
    const spawn = vi.fn().mockReturnValueOnce(first.child).mockReturnValueOnce(second.child);
    const client = createNativeTtsClient({ spawn });
    const job = client.generate('Hi.', 'af_heart');
    first.die(9);
    await expect(job).rejects.toThrow(/9/);
    const again = client.generate('Hi again.', 'af_heart');
    expect(spawn).toHaveBeenCalledTimes(2);
    second.reply({ type: 'audio', id: second.sent[0].id, wav, duration: 1 });
    await expect(again).resolves.toMatchObject({ duration: 1 });
  });

  it('ignora respuestas con forma inválida o de ids desconocidos', async () => {
    const f = fakeChild();
    const client = createNativeTtsClient({ spawn: () => f.child });
    const job = client.generate('Hi.', 'af_heart');
    f.reply({ type: 'audio', id: 999, wav, duration: 1 });
    f.reply({ nonsense: true });
    f.reply({ type: 'audio', id: f.sent[0].id, wav, duration: 2 });
    await expect(job).resolves.toMatchObject({ duration: 2 });
  });

  it('dispose mata el proceso', () => {
    const f = fakeChild();
    const client = createNativeTtsClient({ spawn: () => f.child });
    const warm = client.warm();
    client.dispose();
    expect(f.child.kill).toHaveBeenCalled();
    return expect(warm).rejects.toThrow(/cerrado/);
  });
});

describe('parseGenerateArgs (entrada del IPC)', () => {
  it('acepta texto y voz válidos', () => {
    expect(parseGenerateArgs({ text: 'Hi.', voice: 'af_heart' })).toEqual({ text: 'Hi.', voice: 'af_heart' });
  });

  it('rechaza texto vacío, gigante o voz con forma rara', () => {
    expect(() => parseGenerateArgs({ text: '', voice: 'af_heart' })).toThrow();
    expect(() => parseGenerateArgs({ text: 'x'.repeat(5001), voice: 'af_heart' })).toThrow();
    expect(() => parseGenerateArgs({ text: 'Hi.', voice: '../etc' })).toThrow();
  });
});
