import { app } from 'electron';
import serve from 'electron-serve';
import { rendererOutDir } from './paths';

// EMMA_FORCE_PROD=1: el smoke de producción (scripts/package-smoke.mjs) recorre
// el camino empaquetado (electron-serve + app://-) sin empaquetar.
export const isDev = process.env.EMMA_FORCE_PROD === '1' ? false : !app.isPackaged;

// Sirve el export estático de Next bajo app://- en producción. OJO: este archivo
// compila a build/main/config.js, así que __dirname es build/main; la resolución
// real vive en paths.ts con su test (el release v0.1.0 salió blanco por esto).
export const appServe = serve({
  directory: rendererOutDir(__dirname),
});

export function getResourcePath(): string {
  return isDev ? process.cwd() : process.resourcesPath;
}
