/**
 * Cliente del almacén JSON del main (window.emmaAPI.storeGet/storeSet).
 *
 * Los repositorios del renderer (infrastructure) usan esto para leer/escribir una
 * colección completa. Mono-usuario local: cada entidad se guarda bajo la clave
 * fija LOCAL_USER dentro de su colección. Defensivo fuera de Electron (tests/SSR).
 */

export const LOCAL_USER = "default";

function api() {
  return typeof window !== "undefined" ? window.emmaAPI : undefined;
}

/** Lee la colección completa (objeto id→valor). */
export async function readCollection<T>(key: string): Promise<Record<string, T>> {
  const a = api();
  if (!a) return {};
  return (await a.storeGet(key)) as Record<string, T>;
}

/** Lee la entrada del usuario local de una colección. */
export async function readOne<T>(key: string): Promise<T | null> {
  const all = await readCollection<T>(key);
  return (all[LOCAL_USER] as T) ?? null;
}

/** Escribe (merge) la entrada del usuario local en una colección. */
export async function writeOne<T>(key: string, value: T): Promise<void> {
  const a = api();
  if (!a) return;
  const all = await readCollection<T>(key);
  all[LOCAL_USER] = value;
  await a.storeSet(key, all as Record<string, unknown>);
}
