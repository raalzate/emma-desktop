// =============================================================================
// IA remota (proceso main): almacén CIFRADO de llaves + llamada a los proveedores.
//
// Las llaves NUNCA llegan al renderer: se guardan cifradas con safeStorage (que
// usa el llavero del SO) en userData/ai-keys.json, y las peticiones HTTP a los
// proveedores se hacen aquí en el main. El renderer sólo pide "genera" y recibe
// texto, o consulta qué proveedores tienen llave (booleanos, no la llave).
// Lo puro (peticiones, mensajes, reintento, validación) vive en ai-remote-http.ts.
// =============================================================================

import { app, safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';
import {
  REMOTE_PROVIDERS,
  RemoteHttpError,
  buildGenerateRequest,
  buildVerifyRequest,
  describeRemoteError,
  parseGenerateResponse,
  withRetry,
  type HttpRequest,
  type RemoteGenerateArgs,
  type RemoteProvider,
} from './ai-remote-http';

export type { RemoteGenerateArgs, RemoteProvider };

// La capa gratuita de Gemini limita por minuto: tres intentos cubren un pico corto.
const RETRY = { attempts: 3, baseDelayMs: 1500 };

function keysFile(): string {
  return path.join(app.getPath('userData'), 'ai-keys.json');
}

function readStore(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(keysFile(), 'utf-8')) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, string>): void {
  fs.writeFileSync(keysFile(), JSON.stringify(store), 'utf-8');
}

/** Hace la petición y convierte un estado no-OK en RemoteHttpError. */
async function send({ url, init }: HttpRequest): Promise<unknown> {
  const res = await fetch(url, init);
  if (!res.ok) throw new RemoteHttpError(res.status, await res.text());
  return res.json();
}

function friendly(provider: RemoteProvider, err: unknown): Error {
  if (err instanceof RemoteHttpError) return new Error(describeRemoteError(provider, err.status, err.body));
  return new Error(`Could not reach ${provider}. Check your internet connection.`);
}

/** ¿La llave sirve? Lista modelos del proveedor: no consume cuota de generación. */
async function verifyAiKey(provider: RemoteProvider, key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await send(buildVerifyRequest(provider, key));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(provider, err).message };
  }
}

/** Verifica y guarda (cifrada) la llave de un proveedor. Llave vacía → la borra. */
export async function setAiKey(provider: RemoteProvider, key: string): Promise<{ ok: boolean; error?: string }> {
  const store = readStore();
  if (!key) {
    delete store[provider];
    writeStore(store);
    return { ok: true };
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return { ok: false, error: 'System encryption is not available on this computer.' };
  }
  const verified = await verifyAiKey(provider, key);
  if (!verified.ok) return verified;
  store[provider] = safeStorage.encryptString(key).toString('base64');
  writeStore(store);
  return { ok: true };
}

export function deleteAiKey(provider: RemoteProvider): { ok: boolean } {
  const store = readStore();
  delete store[provider];
  writeStore(store);
  return { ok: true };
}

/** Estado (booleano) de configuración por proveedor — sin exponer la llave. */
export function aiKeyStatus(): Record<RemoteProvider, boolean> {
  const store = readStore();
  return Object.fromEntries(REMOTE_PROVIDERS.map((p) => [p, !!store[p]])) as Record<RemoteProvider, boolean>;
}

function decryptKey(provider: RemoteProvider): string | null {
  const enc = readStore()[provider];
  if (!enc) return null;
  try {
    return safeStorage.decryptString(Buffer.from(enc, 'base64'));
  } catch {
    return null;
  }
}

/** Genera texto con el proveedor remoto elegido. Lanza con mensaje claro. */
export async function remoteGenerate({ provider, model, prompt, system }: RemoteGenerateArgs): Promise<string> {
  const key = decryptKey(provider);
  if (!key) throw new Error(`No API key configured for ${provider}. Add one in Settings.`);
  try {
    const data = await withRetry(() => send(buildGenerateRequest(provider, key, model, prompt, system)), RETRY);
    return parseGenerateResponse(provider, data);
  } catch (err) {
    throw friendly(provider, err);
  }
}
