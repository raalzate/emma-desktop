/**
 * Freno: ninguna feature SDD nace sin milestone (política del plan).
 *
 * La regla vino del humano: «siempre pregunta por el Milestone — debe existir
 * uno o crearse». Un issue sin milestone es trabajo fuera del plan. El freno
 * vive en `scripts/sdd-github.mjs new`, que muere ANTES de tocar la red si
 * falta `--milestone`. Aquí su prueba de vida: se ejecuta el script de verdad
 * (sin red: la validación es lo primero) y se afirma el rechazo.
 */

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

const SCRIPT = path.join(process.cwd(), "scripts", "sdd-github.mjs");

function correr(args: string[]): { code: number; stderr: string } {
  try {
    // `process.execPath` y no "node": el PATH recortado (para negar `gh`) se
    // llevaría también a node si viene de nvm.
    execFileSync(process.execPath, [SCRIPT, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      // Sin gh en el PATH: si la validación intentara la red, fallaría por otro
      // motivo y el mensaje no sería el de la política — eso también se afirma.
      env: { ...process.env, PATH: "/usr/bin:/bin" },
      timeout: 15_000,
    });
    return { code: 0, stderr: "" };
  } catch (e) {
    const err = e as { status?: number; stderr?: Buffer | string };
    return { code: err.status ?? -1, stderr: String(err.stderr ?? "") };
  }
}

describe("sdd:new exige milestone (política del plan)", () => {
  it("sin --milestone muere con la política, antes de tocar la red", () => {
    const r = correr(["new", "borrador/x/spec.md"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("milestone");
    expect(r.stderr).toContain("política del plan");
  });

  it("con --milestone vacío también muere", () => {
    const r = correr(["new", "borrador/x/spec.md", "--milestone", "  "]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("política del plan");
  });

  it("el uso documenta el flag: quien copie el comando ya pregunta por el milestone", () => {
    const r = correr(["new"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("--milestone");
  });
});
