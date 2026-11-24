/**
 * Ningún workflow descarga los binarios CUDA de onnxruntime-node.
 *
 * Incidente (2026-11-24): el postinstall de onnxruntime-node, en Linux x64,
 * baja de GitHub `onnxruntime-linux-x64-gpu-<versión>.tgz`. Microsoft retiró ese
 * asset de la v1.21.0, el `pnpm install` dio 404 y el CI de `main` quedó rojo
 * sin que cambiara una línea del repo (el mismo commit había pasado en el PR).
 * La voz corre en CPU: el proveedor CUDA nunca se usa. Saltarlo a nivel de
 * workflow cubre cada job y cada paso de instalación, también los que vengan.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const WORKFLOWS = path.join(RAIZ, ".github/workflows");

const conInstalacion = fs
  .readdirSync(WORKFLOWS)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => ({ nombre: f, yml: fs.readFileSync(path.join(WORKFLOWS, f), "utf8") }))
  .filter(({ yml }) => /pnpm install/.test(yml));

describe("workflows que instalan dependencias", () => {
  it("existe al menos uno (la prueba no pasa en vacío)", () => {
    expect(conInstalacion.length).toBeGreaterThan(0);
  });

  it.each(conInstalacion.map((w) => [w.nombre, w.yml]))(
    "%s salta la descarga CUDA de onnxruntime-node a nivel de workflow",
    (_nombre, yml) => {
      const envGlobal = /^env:\n((?:[ \t]+.*\n?)+)/m.exec(yml)?.[1] ?? "";
      expect(envGlobal, "sin esto, el postinstall depende de un asset que GitHub puede retirar").toMatch(
        /^\s+ONNXRUNTIME_NODE_INSTALL_CUDA:\s*["']?skip["']?\s*$/m,
      );
    },
  );
});
