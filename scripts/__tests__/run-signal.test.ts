/**
 * El gate lanza cada señal sin shell (el argv del config no pasa por un intérprete).
 * En Windows eso rompía todas las señales de `pnpm` (#260): `pnpm` es un `.cmd` y
 * Node exige shell para lanzarlo, así que typecheck, tests, build y smoke fallaban
 * al instante, sin salida, aunque el código estuviera bien.
 */
import { describe, expect, it } from "vitest";
import { spawnPlan } from "../run-signal.mjs";

describe("spawnPlan", () => {
  it("en macOS y Linux lanza el argv tal cual, sin shell", () => {
    for (const platform of ["darwin", "linux"]) {
      expect(spawnPlan(["pnpm", "test"], platform)).toEqual({ command: "pnpm", args: ["test"], shell: false });
    }
  });

  it("en Windows usa shell para que `pnpm` (.cmd) arranque", () => {
    const plan = spawnPlan(["pnpm", "typecheck"], "win32");
    expect(plan.shell).toBe(true);
    expect(plan.command).toBe("pnpm");
    expect(plan.args).toEqual(["typecheck"]);
  });

  it("en Windows entrecomilla los argumentos con espacios o metacaracteres del shell", () => {
    const plan = spawnPlan(["node", "scripts/a b.mjs", "x&y", "plano"], "win32");
    expect(plan.args).toEqual(['"scripts/a b.mjs"', '"x&y"', "plano"]);
  });
});
