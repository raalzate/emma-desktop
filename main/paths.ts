import path from 'path';

/**
 * Resolución de rutas del proceso main COMPILADO. Módulo puro (sin electron)
 * para que los tests fijen el layout: main/*.ts compila a build/main/*.js
 * (tsconfig.electron.json), así que `__dirname` en runtime es <raíz>/build/main
 * — no build/. Confundirlos costó el release v0.1.0 (ventana blanca:
 * electron-serve sirviendo build/main/out, que no existe).
 */

/** Directorio del export estático de Next (destino del script `move-out`). */
export function rendererOutDir(compiledDir: string): string {
  return path.resolve(compiledDir, '..', 'out');
}

/** Directorio assets/ en la raíz (del repo en dev, del asar empaquetado en prod). */
export function assetsDir(compiledDir: string): string {
  return path.resolve(compiledDir, '..', '..', 'assets');
}
