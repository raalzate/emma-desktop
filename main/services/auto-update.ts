/**
 * Auto-update (spec #137). El main sólo EJECUTA lo que decide el dominio puro
 * (src/domain/updates/update-policy): auto-instalar en Windows/Linux, descarga
 * manual en macOS con firma ad-hoc (Squirrel.Mac rechaza updates sin firma),
 * nada si estamos al día.
 *
 * Contratos duros:
 *  - Empaquetado solamente: en dev toda búsqueda responde «al día» sin red.
 *  - Tolerante a fallo: ningún error de red/feed rompe la app ni bloquea el
 *    arranque — se emite `error` por el canal y se sigue.
 *  - La instalación (`quitAndInstall`) ocurre SOLO tras confirmación del
 *    usuario vía IPC; jamás por decisión propia del main.
 */

import { app, shell, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { resolveUpdateAction } from '../../src/domain/updates/update-policy';

/** Página del release: el camino manual (macOS ad-hoc) y el de último recurso. */
const RELEASES_URL = 'https://github.com/raalzate/emma-desktop/releases/latest';

/** Retraso del chequeo de arranque: la ventana y la IA local cargan primero. */
const STARTUP_CHECK_DELAY_MS = 15_000;

export type UpdateStatus =
  | { state: 'checking' }
  | { state: 'none'; version: string }
  | { state: 'available'; version: string; action: 'auto' | 'manual' }
  | { state: 'downloading'; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error' };

function broadcast(status: UpdateStatus): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('update-status', status);
  }
}

let wired = false;

/** Cablea los eventos del updater UNA vez (electron-updater es singleton). */
function wireUpdater(): void {
  if (wired) return;
  wired = true;
  // La descarga nunca arranca sola: el dominio decide y el usuario acepta.
  autoUpdater.autoDownload = false;
  autoUpdater.on('download-progress', (p) => {
    broadcast({ state: 'downloading', percent: Math.round(p.percent) });
  });
  autoUpdater.on('update-downloaded', (info) => {
    broadcast({ state: 'ready', version: info.version });
  });
  autoUpdater.on('error', () => {
    // Sin red, feed caído, release sin latest.yml: aviso discreto y a seguir.
    broadcast({ state: 'error' });
  });
}

/** Busca updates y emite el estado. Nunca lanza; en dev responde «al día». */
export async function checkForUpdates(): Promise<void> {
  const current = app.getVersion();
  if (!app.isPackaged) {
    broadcast({ state: 'none', version: current });
    return;
  }
  wireUpdater();
  broadcast({ state: 'checking' });
  try {
    const result = await autoUpdater.checkForUpdates();
    const latest = result?.updateInfo?.version ?? '';
    const action = resolveUpdateAction({
      current,
      latest,
      platform: process.platform as 'darwin' | 'win32' | 'linux',
      signed: false, // la firma es ad-hoc; con firma real, macOS pasa a auto
    });
    if (action === 'none') broadcast({ state: 'none', version: current });
    else broadcast({ state: 'available', version: latest, action });
  } catch {
    broadcast({ state: 'error' });
  }
}

/** El usuario aceptó en una plataforma auto: descarga (progreso por eventos). */
export async function downloadUpdate(): Promise<void> {
  if (!app.isPackaged) return;
  wireUpdater();
  try {
    await autoUpdater.downloadUpdate();
  } catch {
    broadcast({ state: 'error' });
  }
}

/** El usuario confirmó reiniciar: instala y relanza. */
export function installUpdate(): void {
  if (!app.isPackaged) return;
  autoUpdater.quitAndInstall();
}

/** Camino manual (macOS ad-hoc): abrir la página del release. */
export async function openDownloadPage(): Promise<void> {
  await shell.openExternal(RELEASES_URL);
}

export function currentVersion(): string {
  return app.getVersion();
}

/** Chequeo de arranque, diferido y tolerante a fallo. Llamar en whenReady. */
export function scheduleStartupCheck(): void {
  if (!app.isPackaged) return;
  setTimeout(() => {
    void checkForUpdates();
  }, STARTUP_CHECK_DELAY_MS);
}
