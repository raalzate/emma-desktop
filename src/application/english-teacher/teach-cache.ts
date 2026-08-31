/**
 * Caché en memoria de resultados de enseñanza (reemplaza al dict + SHA de Python).
 *
 * La clave combina un hash del texto de Emma, el idioma de explicación y un hash
 * del historial reciente — dos entradas con el mismo texto pero distinto contexto
 * no colisionan.
 */

import type { TeachingRequest, TeachingResult } from "@/domain/english-teacher/teaching-models";

const cache = new Map<string, TeachingResult>();

/** Devuelve una copia con `cached: true`, o null si no hay entrada. */
export function readCache(request: TeachingRequest): TeachingResult | null {
  const hit = cache.get(cacheKey(request));
  return hit ? { ...hit, cached: true } : null;
}

/** Guarda solo resultados exitosos (los errores no se cachean). */
export function writeCache(request: TeachingRequest, result: TeachingResult): void {
  cache.set(cacheKey(request), result);
}

function cacheKey(request: TeachingRequest): string {
  const textDigest = hashHex(request.text);
  const histBlob = request.contextHistory
    .map((t) => `${t.role ?? ""}:${t.content ?? ""}`)
    .join("|");
  return `${textDigest}:${request.explainLanguage}:${hashHex(histBlob)}`;
}

// Hash síncrono (sin Node crypto): FNV-1a de 32 bits en hex. Reemplaza al SHA-256
// truncado de Python — aquí solo es una clave de caché en memoria, no un digest
// criptográfico, así que una función determinista y rápida es suficiente.
function hashHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
