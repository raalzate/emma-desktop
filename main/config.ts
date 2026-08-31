import { app } from 'electron';
import path from 'path';
import serve from 'electron-serve';

export const isDev = !app.isPackaged;

// Sirve el export estático de Next bajo app://- en producción. Tras `move-out`
// el export vive en build/out; main.js está en build/, así que __dirname/out.
export const appServe = serve({
  directory: path.join(__dirname, 'out'),
});

export function getResourcePath(): string {
  return isDev ? process.cwd() : process.resourcesPath;
}
