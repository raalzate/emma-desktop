import { ipcMain, IpcMainInvokeEvent, clipboard } from 'electron';
import {
  listLitertModels,
  downloadLitertModel,
  deleteLitertModel,
  revealLitertModel,
} from './services/litert-models';
import {
  setAiKey,
  deleteAiKey,
  aiKeyStatus,
  remoteGenerate,
  type RemoteProvider,
  type RemoteGenerateArgs,
} from './services/ai-remote';
import { getSystemInfo } from './services/system-info';
import {
  checkForUpdates,
  currentVersion,
  downloadUpdate,
  installUpdate,
  openDownloadPage,
} from './services/auto-update';
import { storeGet, storeSet } from './services/store';
import { synthesizeTts } from './services/tts';

/**
 * IPC del proceso main de EMMA. La IA local (Gemma) corre en el RENDERER
 * (LiteRT-LM/WebGPU); aquí quedan: modelos .litertlm, IA remota (llaves cifradas),
 * info del sistema, portapapeles y el almacén JSON de datos del usuario.
 */
export function registerIpcHandlers(): void {
  // --- Modelos LiteRT-LM (.litertlm) ---
  ipcMain.handle('litert-models-list', async () => listLitertModels());
  ipcMain.handle('litert-model-download', async (event: IpcMainInvokeEvent, id: string) =>
    downloadLitertModel(id as any, (percent) =>
      event.sender.send('litert-model-progress', { id, percent })
    )
  );
  ipcMain.handle('litert-model-delete', async (_e, id: string) => deleteLitertModel(id));
  ipcMain.handle('litert-model-reveal', async (_e, id: string) => revealLitertModel(id));

  // --- IA remota (llaves cifradas + generación) ---
  ipcMain.handle('ai-key-set', async (_e, provider: RemoteProvider, key: string) =>
    setAiKey(provider, key)
  );
  ipcMain.handle('ai-key-delete', async (_e, provider: RemoteProvider) => deleteAiKey(provider));
  ipcMain.handle('ai-key-status', async () => aiKeyStatus());
  ipcMain.handle('ai-remote-generate', async (_e, args: RemoteGenerateArgs) => remoteGenerate(args));

  // --- Info del sistema (vista de Configuración) ---
  ipcMain.handle('system-info', async () => getSystemInfo());

  // --- TTS Edge (voz de Emma + timings de karaoke) ---
  ipcMain.handle('tts-synthesize', async (_e, text: string, voice?: string) =>
    synthesizeTts(text, voice)
  );

  // --- Almacén JSON de datos del usuario (perfil, progreso, sesiones…) ---
  ipcMain.handle('store-get', async (_e, key: string) => storeGet(key));
  ipcMain.handle('store-set', async (_e, key: string, value: Record<string, unknown>) =>
    storeSet(key, value)
  );

  // --- Portapapeles ---
  ipcMain.handle('copy-to-clipboard', async (_e, text: string) => {
    try {
      clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      return false;
    }
  });
}
