/**
 * El marcador del gate tiene que existir también dentro de un git worktree.
 *
 * Incidente (release v0.2.0): el gate se corrió en un worktree y el self-test
 * murió con `ENOTDIR: not a directory, lstat '.../.git/gate-dirty'`, porque en
 * un worktree `.git` es un ARCHIVO que apunta al repo real. Con el gate
 * imposible de correr ahí, no había forma de verificar un release sin ensuciar
 * el árbol principal. La prueba monta un worktree de verdad: si alguien vuelve a
 * calcular la ruta con `path.join(repo, ".git", ...)`, falla acá.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { resolveGateMarker } from "../gate-marker.mjs";

const git = (args: string[], cwd: string) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

describe("resolveGateMarker", () => {
  let base = "";
  let principal = "";
  let worktree = "";

  beforeAll(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "emma-marcador-"));
    principal = path.join(base, "repo");
    worktree = path.join(base, "arbol");

    fs.mkdirSync(principal);
    git(["init", "-q", "-b", "main"], principal);
    git(["config", "user.email", "prueba@emma.local"], principal);
    git(["config", "user.name", "prueba"], principal);
    fs.writeFileSync(path.join(principal, "archivo.txt"), "hola");
    git(["add", "archivo.txt"], principal);
    git(["commit", "-qm", "inicial"], principal);
    git(["worktree", "add", "-q", worktree, "-b", "rama"], principal);
  });

  afterAll(() => {
    fs.rmSync(base, { recursive: true, force: true });
  });

  it("en el árbol principal apunta al .git del repo", () => {
    const marcador = resolveGateMarker(".git/gate-dirty", principal)!;
    expect(fs.statSync(path.dirname(marcador)).isDirectory()).toBe(true);
    expect(path.basename(marcador)).toBe("gate-dirty");
  });

  it("en un worktree apunta al MISMO .git, no al archivo .git del worktree", () => {
    // El síntoma exacto del incidente: acá `.git` es un archivo.
    expect(fs.statSync(path.join(worktree, ".git")).isFile()).toBe(true);

    const marcador = resolveGateMarker(".git/gate-dirty", worktree)!;
    expect(fs.statSync(path.dirname(marcador)).isDirectory()).toBe(true);
    expect(fs.realpathSync(path.dirname(marcador))).toBe(
      fs.realpathSync(path.join(principal, ".git")),
    );
  });

  it("el marcador se puede escribir y borrar desde el worktree", () => {
    const marcador = resolveGateMarker(".git/gate-dirty", worktree)!;
    fs.writeFileSync(marcador, "sucio");
    expect(fs.existsSync(marcador)).toBe(true);
    fs.rmSync(marcador, { force: true });
    expect(fs.existsSync(marcador)).toBe(false);
  });

  it("un marcador fuera de .git se resuelve contra la raíz del repo", () => {
    expect(resolveGateMarker("tmp/pendiente", principal)).toBe(path.join(principal, "tmp/pendiente"));
  });
});
