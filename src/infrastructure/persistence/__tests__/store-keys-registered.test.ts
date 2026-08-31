/**
 * Guardia contra una clase de bug silencioso: un repositorio que usa una clave
 * no registrada en el almacén del main hace fallar `assertKey` en runtime y su
 * persistencia se pierde sin rastro (pasó con "srs" y "self-assessment").
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STORE_KEYS } from "../../../../main/services/store-keys";

const PERSISTENCE_DIR = join(__dirname, "..");

function repositoryFiles(): string[] {
  return readdirSync(PERSISTENCE_DIR).filter((f) => f.endsWith("-repository.ts"));
}

// Extrae las claves declaradas como `const KEY = "..."` en cada repositorio.
function declaredKeys(file: string): string[] {
  const source = readFileSync(join(PERSISTENCE_DIR, file), "utf-8");
  return [...source.matchAll(/const KEY\w* = "([^"]+)"/g)].map((m) => m[1]);
}

describe("claves del almacén", () => {
  it("registra en STORE_KEYS todas las claves usadas por los repositorios", () => {
    const noRegistradas = repositoryFiles().flatMap((file) =>
      declaredKeys(file)
        .filter((key) => !STORE_KEYS.includes(key as (typeof STORE_KEYS)[number]))
        .map((key) => `${file} → "${key}"`),
    );

    expect(noRegistradas).toEqual([]);
  });

  it("encuentra repositorios con clave declarada (la extracción no está vacía)", () => {
    const conClave = repositoryFiles().filter((f) => declaredKeys(f).length > 0);
    expect(conClave.length).toBeGreaterThan(5);
  });

  it("no tiene claves duplicadas", () => {
    expect(new Set(STORE_KEYS).size).toBe(STORE_KEYS.length);
  });
});
