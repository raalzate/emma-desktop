/**
 * Almacén de datos de EMMA en el proceso main — un documento JSON por "colección"
 * bajo userData/emma/store/ (override con EMMA_DB_DIR). Reemplaza a SQLite: para
 * una app de escritorio mono-usuario, archivos JSON alcanzan
 * (sin dependencias nativas, portable, respaldables).
 *
 * El renderer NUNCA lee estos archivos: pasa por los handlers IPC (store-get/set),
 * y las capas de repositorio del renderer mapean los puertos del dominio encima.
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

import { STORE_KEYS, type StoreKey } from './store-keys';

export type { StoreKey };

function storeDir(): string {
  const base = process.env.EMMA_DB_DIR || path.join(app.getPath('userData'), 'emma');
  const dir = path.join(base, 'store');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileFor(key: StoreKey): string {
  return path.join(storeDir(), `${key}.json`);
}

function assertKey(key: string): asserts key is StoreKey {
  if (!STORE_KEYS.includes(key as StoreKey)) throw new Error(`Colección inválida: ${key}`);
}

/** Lee el documento de una colección (objeto vacío si no existe/corrupto). */
export function storeGet(key: string): Record<string, unknown> {
  assertKey(key);
  try {
    return JSON.parse(fs.readFileSync(fileFor(key), 'utf-8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Escribe el documento completo de una colección (escritura atómica vía tmp). */
export function storeSet(key: string, value: Record<string, unknown>): { ok: boolean } {
  assertKey(key);
  const dest = fileFor(key);
  const tmp = dest + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value ?? {}, null, 2), 'utf-8');
  fs.renameSync(tmp, dest);
  return { ok: true };
}
