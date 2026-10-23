// =============================================================================
// Voz nativa: cablea el cliente al utilityProcess real de Electron. El host
// corre en su propio proceso (crash aislado) con la caché del modelo en
// userData/models/kokoro.
// =============================================================================

import { app, utilityProcess } from 'electron';
import path from 'path';
import { createNativeTtsClient, type NativeSpeech, type TtsChild } from './client';
import type { HostRequest } from './protocol';

function spawnHost(): TtsChild {
  const child = utilityProcess.fork(path.join(__dirname, 'host.js'), [], {
    serviceName: 'EMMA voice',
    // EMMA_KOKORO_CACHE del entorno gana: CI la apunta a un directorio cacheado.
    env: {
      ...process.env,
      EMMA_KOKORO_CACHE: process.env.EMMA_KOKORO_CACHE ?? path.join(app.getPath('userData'), 'models', 'kokoro'),
    },
  });
  return {
    postMessage: (message: HostRequest) => child.postMessage(message),
    onMessage: (cb) => void child.on('message', cb),
    onExit: (cb) => void child.on('exit', cb),
    kill: () => void child.kill(),
  };
}

const client = createNativeTtsClient({ spawn: spawnHost });

export const warmNativeTts = (): Promise<void> => client.warm();
export const generateNativeTts = (text: string, voice: string): Promise<NativeSpeech> => client.generate(text, voice);
