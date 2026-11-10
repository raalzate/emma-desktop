// =============================================================================
// Handlers del audio guardado, sin Electron: reciben el almacén, el logger y la
// consulta de permiso del micrófono por inyección. `ipc.ts` sólo los registra.
// Un ZodError nunca tumba el IPC: se responde `invalid` y se registra (FR-036).
// =============================================================================

import { ZodError } from 'zod';
import type { AudioStoreService, StoredClip } from './audio-store';
import { parseClipId, parseConversationArgs, parseIdsArgs, parseSaveArgs } from './audio-protocol';

export type MicAccessStatus = 'granted' | 'denied' | 'restricted' | 'not-determined' | 'unknown';

const MIC_STATUSES: readonly MicAccessStatus[] = ['granted', 'denied', 'restricted', 'not-determined'];

export function normalizeMicStatus(raw: unknown): MicAccessStatus {
  return MIC_STATUSES.find((s) => s === raw) ?? 'unknown';
}

export interface AudioHandlerDeps {
  store: AudioStoreService;
  log: (...args: unknown[]) => void;
  /** Estado del SO (systemPreferences.getMediaAccessStatus); puede lanzar en Linux. */
  micStatus: () => string;
}

export function createAudioHandlers({ store, log, micStatus }: AudioHandlerDeps) {
  /** Ejecuta `run`; ante entrada inválida o fallo devuelve `fallback`. */
  function guarded<T>(what: string, fallback: T, run: () => T): T {
    try {
      return run();
    } catch (e) {
      log(`[audio] ${what}: ${e instanceof ZodError ? 'entrada inválida' : 'fallo'}`, e);
      return fallback;
    }
  }

  return {
    save(raw: unknown): { ok: true } | { ok: false; error: 'invalid' | 'io' } {
      let args;
      try {
        args = parseSaveArgs(raw);
      } catch (e) {
        log('[audio] save: entrada inválida', e);
        return { ok: false, error: 'invalid' };
      }
      try {
        store.saveClip(args.meta, args.data);
        return { ok: true };
      } catch (e) {
        log('[audio] save: fallo de disco', e);
        return { ok: false, error: 'io' };
      }
    },
    read: (raw: unknown): StoredClip | null => guarded('read', null, () => store.readClip(parseClipId(raw))),
    remove: (raw: unknown) =>
      guarded('remove', { removed: 0 }, () => ({ removed: store.removeClips(parseIdsArgs(raw)) })),
    removeConversation: (raw: unknown) =>
      guarded('removeConversation', { removed: 0 }, () => ({
        removed: store.removeByConversation(parseConversationArgs(raw)),
      })),
    removeAll: (): { ok: boolean } =>
      guarded<{ ok: boolean }>('removeAll', { ok: false }, () => {
        store.removeAll();
        return { ok: true };
      }),
    list: () => guarded('list', [], () => store.listClips()),
    usage: () => guarded('usage', { count: 0, bytes: 0 }, () => store.usage()),
    micStatus: (): MicAccessStatus => normalizeMicStatus(guarded('micStatus', 'unknown', micStatus)),
  };
}
