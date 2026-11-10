// =============================================================================
// Servicio de archivos del audio guardado. Layout bajo `<root>/audio/`:
//   index.json        metadatos (única fuente de verdad), escritura atómica
//   clips/<id>.webm   binario Opus/WebM
// Sin Electron: recibe el directorio raíz (userData/emma o EMMA_DB_DIR).
// =============================================================================

import fs from 'fs';
import path from 'path';
import { parseClipId, type AudioClipMetaWire } from './audio-protocol';

export interface StoredClip {
  meta: AudioClipMetaWire;
  data: Uint8Array;
}

export interface AudioStoreService {
  saveClip(meta: AudioClipMetaWire, data: Uint8Array): void;
  readClip(id: string): StoredClip | null;
  removeClips(ids: readonly string[]): number;
  removeByConversation(conversationId: string): number;
  removeAll(): void;
  listClips(): AudioClipMetaWire[];
  usage(): { count: number; bytes: number };
  reconcile(): { orphanFiles: number; missingFiles: number };
}

const EXT = '.webm';

/** Escritura atómica: archivo temporal + rename. */
function writeAtomic(dest: string, content: string | Uint8Array): void {
  const tmp = dest + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, dest);
}

export function createAudioStore(root: string): AudioStoreService {
  const audioDir = path.join(root, 'audio');
  const clipsDir = path.join(audioDir, 'clips');
  const indexFile = path.join(audioDir, 'index.json');

  const ensureDirs = () => fs.mkdirSync(clipsDir, { recursive: true });

  /** Valida el id y confirma con path.relative que la ruta queda dentro de clips/. */
  function clipPath(id: string): string {
    parseClipId(id);
    const resolved = path.resolve(clipsDir, id + EXT);
    const rel = path.relative(clipsDir, resolved);
    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error('Ruta de clip fuera del directorio de audio');
    }
    return resolved;
  }

  function readIndex(): AudioClipMetaWire[] {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
      return Array.isArray(parsed) ? (parsed as AudioClipMetaWire[]) : [];
    } catch {
      return [];
    }
  }

  const writeIndex = (entries: readonly AudioClipMetaWire[]) => {
    ensureDirs();
    writeAtomic(indexFile, JSON.stringify(entries));
  };

  const unlinkQuiet = (file: string): boolean => {
    try {
      fs.unlinkSync(file);
      return true;
    } catch {
      return false;
    }
  };

  function removeEntries(ids: readonly string[]): number {
    const index = readIndex();
    const wanted = new Set(ids);
    let removed = 0;
    for (const entry of index) {
      if (!wanted.has(entry.id)) continue;
      unlinkQuiet(clipPath(entry.id));
      removed++;
    }
    if (removed > 0) writeIndex(index.filter((e) => !wanted.has(e.id)));
    return removed;
  }

  return {
    saveClip(meta, data) {
      const dest = clipPath(meta.id);
      ensureDirs();
      // Binario primero: si el proceso muere antes del índice, reconcile lo limpia.
      writeAtomic(dest, data);
      writeIndex([...readIndex().filter((e) => e.id !== meta.id), meta]);
    },

    readClip(id) {
      const file = clipPath(id);
      const meta = readIndex().find((e) => e.id === id);
      if (!meta) return null;
      try {
        return { meta, data: new Uint8Array(fs.readFileSync(file)) };
      } catch {
        return null;
      }
    },

    removeClips: removeEntries,

    removeByConversation(conversationId) {
      const ids = readIndex()
        .filter((e) => e.conversationId === conversationId)
        .map((e) => e.id);
      return removeEntries(ids);
    },

    removeAll() {
      fs.rmSync(clipsDir, { recursive: true, force: true });
      ensureDirs();
      writeIndex([]);
    },

    listClips: readIndex,

    usage() {
      const index = readIndex();
      return { count: index.length, bytes: index.reduce((sum, e) => sum + e.bytes, 0) };
    },

    reconcile() {
      ensureDirs();
      const index = readIndex();
      const files = fs.readdirSync(clipsDir);
      const indexed = new Set(index.map((e) => e.id + EXT));
      let orphanFiles = 0;
      for (const f of files) {
        if (indexed.has(f)) continue;
        // Ruta armada con join sobre un nombre listado por el propio readdir.
        if (unlinkQuiet(path.join(clipsDir, f))) orphanFiles++;
      }
      const present = new Set(files);
      const alive = index.filter((e) => present.has(e.id + EXT));
      const missingFiles = index.length - alive.length;
      if (missingFiles > 0) writeIndex(alive);
      return { orphanFiles, missingFiles };
    },
  };
}
