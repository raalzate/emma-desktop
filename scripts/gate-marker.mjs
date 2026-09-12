#!/usr/bin/env node
/**
 * Dónde vive el marcador del gate (`gate.marker`, por defecto `.git/gate-dirty`).
 *
 * El "why": el marcador se escribía en `<repo>/.git/gate-dirty` calculado a mano.
 * Dentro de un **git worktree**, `.git` no es un directorio sino un ARCHIVO con
 * una línea `gitdir: …`, así que cualquier escritura bajo esa ruta muere con
 * `ENOTDIR` — y como el self-test del arnés escribe ahí, el gate COMPLETO se
 * volvía imposible de correr en un worktree (incidente del release v0.2.0:
 * `Error: ENOTDIR: not a directory, lstat '…/.git/gate-dirty'`).
 *
 * La ruta correcta la sabe git: `--git-common-dir` devuelve el directorio real
 * del repositorio, el mismo para el árbol principal y para cada worktree — que
 * es justo lo que queremos: un único marcador por repo, no uno por árbol.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

/** Directorio real de git (`.git` del repo), o null si no hay git alrededor. */
export function gitCommonDir(cwd = process.cwd()) {
  try {
    const salida = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return salida || null;
  } catch {
    return null;
  }
}

/**
 * Ruta absoluta del marcador. Un marcador que no empieza con `.git/` se resuelve
 * contra la raíz del repo; sin git alrededor (tarball, imagen de CI sin
 * historial) cae donde decía la config, que es el comportamiento de siempre.
 */
export function resolveGateMarker(marker, repoRoot = process.cwd()) {
  if (!marker) return null;
  if (path.isAbsolute(marker)) return marker;

  const segmentos = marker.split("/");
  if (segmentos[0] !== ".git") return path.join(repoRoot, marker);

  const gitDir = gitCommonDir(repoRoot) ?? path.join(repoRoot, ".git");
  return path.join(gitDir, ...segmentos.slice(1));
}

// Como CLI imprime la ruta, para que `scripts/gate.sh` no la recalcule en bash.
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const { readFileSync } = await import("node:fs");
  let marker = ".git/gate-dirty";
  try {
    marker = JSON.parse(readFileSync(".claude/harness.config.json", "utf8")).gate?.marker ?? marker;
  } catch {
    /* sin config, el valor por defecto */
  }
  process.stdout.write(resolveGateMarker(marker, process.cwd()) ?? "");
}
