#!/usr/bin/env node
/**
 * Lanza UNA señal del gate a partir de su argv (JSON) y sale con su código.
 * Sin shell en macOS/Linux: el argv del config no pasa por un intérprete. En
 * Windows `pnpm`/`npm` son `.cmd` y Node exige shell para lanzarlos (#260): ahí
 * se usa shell y se entrecomilla lo que tenga espacios o metacaracteres.
 *
 *   node scripts/run-signal.mjs '["pnpm","test"]'
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const NECESITA_COMILLAS = /[\s"&|<>^()%!]/;

const comillas = (arg) => (NECESITA_COMILLAS.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);

/** Cómo lanzar `argv` en `platform`: comando, argumentos y si va por shell. */
export function spawnPlan(argv, platform = process.platform) {
  const [command, ...args] = argv;
  if (platform !== "win32") return { command, args, shell: false };
  return { command, args: args.map(comillas), shell: true };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const { command, args, shell } = spawnPlan(JSON.parse(process.argv[2]));
  const r = spawnSync(command, args, { stdio: "inherit", shell });
  if (r.error) console.error(`no se pudo lanzar \`${command}\`: ${r.error.message}`);
  process.exit(r.status === null ? 1 : r.status);
}
