// =============================================================================
// Cliente del proceso utilitario de voz: lo lanza al primer pedido, empareja
// respuestas por id y, si el proceso muere, rechaza lo pendiente y lo vuelve a
// lanzar en el siguiente pedido (un crash de onnxruntime no tumba la app ni deja
// la voz rota para siempre). El proceso entra por `spawn`: probable con un falso.
// =============================================================================

import { parseHostResponse, type HostRequest } from './protocol';

export interface TtsChild {
  postMessage(message: HostRequest): void;
  onMessage(cb: (message: unknown) => void): void;
  onExit(cb: (code: number) => void): void;
  kill(): void;
}

export interface NativeSpeech {
  wav: Uint8Array;
  duration: number;
}

export interface NativeTtsClient {
  warm(): Promise<void>;
  generate(text: string, voice: string): Promise<NativeSpeech>;
  dispose(): void;
}

interface Pending {
  resolve(value: unknown): void;
  reject(error: Error): void;
}

export function createNativeTtsClient({ spawn }: { spawn: () => TtsChild }): NativeTtsClient {
  let child: TtsChild | null = null;
  let nextId = 0;
  const pending = new Map<number, Pending>();

  const rejectAll = (error: Error) => {
    for (const p of pending.values()) p.reject(error);
    pending.clear();
  };

  const ensureChild = (): TtsChild => {
    if (child) return child;
    const spawned = spawn();
    spawned.onMessage((raw) => {
      const response = parseHostResponse(raw);
      const entry = response && pending.get(response.id);
      if (!response || !entry) return;
      pending.delete(response.id);
      if (response.type === 'error') entry.reject(new Error(response.message));
      else if (response.type === 'audio') entry.resolve({ wav: response.wav, duration: response.duration });
      else entry.resolve(undefined);
    });
    spawned.onExit((code) => {
      if (child === spawned) child = null;
      rejectAll(new Error(`El proceso de voz terminó (código ${code})`));
    });
    child = spawned;
    return spawned;
  };

  const request = <T>(message: Omit<HostRequest, 'id'>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      ensureChild().postMessage({ ...message, id } as HostRequest);
    });

  return {
    warm: () => request<void>({ type: 'load' }),
    generate: (text, voice) => request<NativeSpeech>({ type: 'generate', text, voice } as Omit<HostRequest, 'id'>),
    dispose: () => {
      const current = child;
      child = null;
      rejectAll(new Error('Proceso de voz cerrado'));
      current?.kill();
    },
  };
}
