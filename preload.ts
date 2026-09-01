// preload.ts — API expuesta al renderer como window.emmaAPI. La IA local (Gemma
// vía LiteRT-LM/WebGPU) corre en el renderer; aquí sólo: gestión de modelos,
// IA remota (llaves cifradas en el main), info del sistema, portapapeles y el
// almacén JSON de datos del usuario.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('emmaAPI', {
  // --- Modelos LiteRT-LM (.litertlm) ---
  litertModelsList: (): Promise<{ totalRamGB: number; models: any[] }> =>
    ipcRenderer.invoke('litert-models-list'),
  litertModelDownload: (id: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('litert-model-download', id),
  litertModelDelete: (id: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('litert-model-delete', id),
  litertModelReveal: (id: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('litert-model-reveal', id),
  onLitertModelProgress: (callback: (data: { id: string; percent: number }) => void) => {
    const listener = (_e: any, data: any) => callback(data);
    ipcRenderer.on('litert-model-progress', listener);
    return () => ipcRenderer.removeListener('litert-model-progress', listener);
  },

  // --- IA remota (opcional): llaves cifradas en el main + generación ---
  setAiKey: (provider: string, key: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('ai-key-set', provider, key),
  deleteAiKey: (provider: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('ai-key-delete', provider),
  getAiKeyStatus: (): Promise<Record<string, boolean>> => ipcRenderer.invoke('ai-key-status'),
  remoteGenerate: (args: {
    provider: string;
    model: string;
    prompt: string;
    system?: string;
  }): Promise<string> => ipcRenderer.invoke('ai-remote-generate', args),

  // --- Actualizaciones (spec #137) ---
  updatesCheck: (): Promise<void> => ipcRenderer.invoke('updates-check'),
  updatesDownload: (): Promise<void> => ipcRenderer.invoke('updates-download'),
  updatesInstall: (): Promise<void> => ipcRenderer.invoke('updates-install'),
  updatesOpenDownload: (): Promise<void> => ipcRenderer.invoke('updates-open-download'),
  updatesCurrentVersion: (): Promise<string> => ipcRenderer.invoke('updates-current-version'),
  onUpdateStatus: (callback: (status: unknown) => void) => {
    const listener = (_e: any, status: unknown) => callback(status);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },

  // --- Info del sistema ---
  systemInfo: (): Promise<any> => ipcRenderer.invoke('system-info'),

  // --- TTS Edge (voz de Emma + timings de karaoke) ---
  ttsSynthesize: (
    text: string,
    voice?: string
  ): Promise<{ audioBase64: string; mime: string; timings: { word: string; start: number; end: number }[] }> =>
    ipcRenderer.invoke('tts-synthesize', text, voice),

  // --- Almacén de datos del usuario ---
  storeGet: (key: string): Promise<Record<string, unknown>> => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, value: Record<string, unknown>): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('store-set', key, value),

  // --- Navegación desde el menú nativo ---
  navigate: (callback: (route: string) => void) => {
    const listener = (_e: any, route: string) => callback(route);
    ipcRenderer.on('navigate', listener);
    return () => ipcRenderer.removeListener('navigate', listener);
  },

  // --- Portapapeles ---
  copyToClipboard: (text: string): Promise<boolean> =>
    ipcRenderer.invoke('copy-to-clipboard', text),
});
