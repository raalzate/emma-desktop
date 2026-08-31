import { BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import { isDev, appServe } from './config';

/** Crea la ventana principal de EMMA y su menú nativo (ES). */
export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      webSecurity: isDev,
    },
  });

  // La IA local (LiteRT-LM/WebGPU) y el micrófono (dictado) requieren permisos.
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, cb) => cb(true));

  // Diagnóstico: reenvía la consola del renderer al proceso main (aparece en el log).
  win.webContents.on('console-message', (_e, level, message, line, source) => {
    if (level >= 2) console.error(`[renderer] ${message} (${source}:${line})`);
  });
  win.webContents.on('did-fail-load', (_e, code, desc, url) =>
    console.error(`[did-fail-load] ${code} ${desc} ${url}`)
  );

  if (isDev) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    appServe(win).then(() => win.loadURL('app://-'));
    if (process.env.EMMA_DEV_TOOLS === '1') win.webContents.openDevTools();
  }

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  setupMenu(win);
  return win;
}

function setupMenu(win: BrowserWindow): void {
  const navigateTo = (route: string) => win.webContents.send('navigate', route);

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'EMMA',
      submenu: [
        { label: 'Conversar con Emma', click: () => navigateTo('/') },
        { label: 'Mi progreso', click: () => navigateTo('/progress') },
        { label: 'Configuración', click: () => navigateTo('/settings') },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
