import 'dotenv/config'; // Carga .env en el proceso main (la IA remota lee process.env aquí).
import { app, BrowserWindow, protocol, net } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { setupProdLogger } from './main/logger';
import { registerPrivilegedSchemes } from './main/schemes';
import { createMainWindow } from './main/window';
import { registerIpcHandlers } from './main/ipc';
import { scheduleStartupCheck } from './main/services/auto-update';

// Schemes privilegiados. electron-serve encola SU registro (solo 'app') en un
// `queueMicrotask` al importarse, así que una llamada síncrona nuestra quedaría
// ANTES y sería pisada — dejando 'litert-model' sin supportFetchAPI/cors y
// rompiendo el fetch del modelo por LiteRT. Encolamos el nuestro en un microtask
// para que corra DESPUÉS (FIFO) y sea el registro que gana. Ver main/schemes.ts.
queueMicrotask(registerPrivilegedSchemes);

// WebGPU es OBLIGATORIO: la IA local (Gemma vía LiteRT-LM) corre en WebGPU dentro
// del renderer. No desactivar la aceleración por hardware.
app.commandLine.appendSwitch('enable-unsafe-webgpu');
app.commandLine.appendSwitch('enable-features', 'WebGPU,WebGPUDeveloperFeatures');
setupProdLogger();

app.whenReady().then(() => {
  // Sirve userData/models/litert/<archivo>.litertlm vía litert-model://m/<archivo>.
  const litertDir = path.join(app.getPath('userData'), 'models', 'litert');
  protocol.handle('litert-model', (request) => {
    const url = new URL(request.url);
    const file = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    // Evita path traversal: solo el basename dentro de litertDir.
    const safe = path.join(litertDir, path.basename(file));
    return net.fetch(pathToFileURL(safe).toString(), {
      headers: request.headers,
      method: request.method,
    });
  });

  registerIpcHandlers();
  createMainWindow();
  // Chequeo de update diferido: nunca compite con la carga de la IA local.
  scheduleStartupCheck();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
