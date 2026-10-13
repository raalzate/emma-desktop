/**
 * INCIDENTE (#245): la app se cerró tras crear la sesión ONNX de Kokoro y no
 * quedó rastro: ni reporte de crash de macOS ni manejo de `render-process-gone`.
 * Estas pruebas fijan que main deja en el log la causa de cualquier cierre de
 * un proceso del renderer o hijo (GPU, utilidad).
 */

import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { registerCrashTrace } from "../crash-trace";

function entorno() {
  const app = new EventEmitter();
  const webContents = new EventEmitter();
  const log = vi.fn();
  registerCrashTrace({ app, webContents, log });
  return { app, webContents, log };
}

describe("registerCrashTrace", () => {
  it("registra render-process-gone con reason y exitCode", () => {
    const { webContents, log } = entorno();
    webContents.emit("render-process-gone", {}, { reason: "oom", exitCode: 9 });
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toContain("render-process-gone");
    expect(log.mock.calls[0][0]).toContain("oom");
    expect(log.mock.calls[0][0]).toContain("9");
  });

  it("registra child-process-gone con tipo, nombre, reason y exitCode", () => {
    const { app, log } = entorno();
    app.emit("child-process-gone", {}, { type: "GPU", name: "GPU Process", reason: "crashed", exitCode: -1 });
    const line = log.mock.calls[0][0] as string;
    expect(line).toContain("child-process-gone");
    expect(line).toContain("GPU");
    expect(line).toContain("crashed");
    expect(line).toContain("-1");
  });

  it("un cierre limpio (clean-exit) también se anota, sin alarmar", () => {
    const { app, log } = entorno();
    app.emit("child-process-gone", {}, { type: "Utility", reason: "clean-exit", exitCode: 0 });
    expect(log).toHaveBeenCalledOnce();
  });

  it("detalles ausentes o mal formados no tiran el handler", () => {
    const { app, webContents, log } = entorno();
    expect(() => webContents.emit("render-process-gone", {}, undefined)).not.toThrow();
    expect(() => app.emit("child-process-gone", {}, null)).not.toThrow();
    expect(log).toHaveBeenCalledTimes(2);
  });
});
