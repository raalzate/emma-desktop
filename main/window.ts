import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import { isDev, appServe } from './config';
import { assetsDir } from './paths';
import { loadProductionRenderer } from './load-renderer';
import { buildContextMenuTemplate } from './context-menu';

/** Crea la ventana principal de EMMA y su menú nativo (ES). */
export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    icon: path.join(assetsDir(__dirname), 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      webSecurity: isDev,
    },
  });

  // Inmersión: lo que el aprendiz escribe es inglés, así que el diccionario es
  // inglés — con el idioma del sistema (español) Chromium subrayaba la frase
  // entera y no tenía una sola sugerencia útil. En macOS el corrector lo pone
  // el sistema operativo y esta API es no-op.
  if (process.platform !== 'darwin') {
    win.webContents.session.setSpellCheckerLanguages(['en-US']);
  }
  // Sin este menú, el subrayado rojo marca el error pero no dice cómo se escribe.
  wireSpellCheckContextMenu(win);


  // La IA local (LiteRT-LM/WebGPU) y el micrófono (dictado) requieren permisos.
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, cb) => cb(true));

  // Diagnóstico: reenvía la consola del renderer al proceso main (aparece en el log).
  win.webContents.on('console-message', (_e, level, message, line, source) => {
    if (level >= 2) console.error(`[renderer] ${message} (${source}:${line})`);
  });
  win.webContents.on('did-fail-load', (_e, code, desc, url) =>
    console.error(`[did-fail-load] ${code} ${desc} ${url}`)
  );

  if (process.env.EMMA_SMOKE === '1') wireSmokeProbe(win);

  if (isDev) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // La cadena maneja su propio rechazo (ver main/load-renderer.ts): sin eso,
    // abortar la carga al salir imprimía el MISMO ERR_FAILED que `app://-` roto.
    void loadProductionRenderer(win, appServe);
    if (process.env.EMMA_DEV_TOOLS === '1') win.webContents.openDevTools();
  }

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  setupMenu(win);
  return win;
}

/**
 * Sonda del smoke de producción (EMMA_SMOKE=1): sale 0 sólo si el renderer
 * cargó Y tiene contenido — una ventana blanca por ruta rota sale 1, que es
 * exactamente lo que el release v0.1.0 no verificó.
 */
function wireSmokeProbe(win: BrowserWindow): void {
  win.webContents.on('did-fail-load', () => app.exit(1));
  win.webContents.on('did-finish-load', async () => {
    const hasContent = await win.webContents
      .executeJavaScript('document.body !== null && document.body.innerHTML.length > 0')
      .catch(() => false);
    app.exit(hasContent ? 0 : 1);
  });
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

/** Cablea el menú contextual a la ventana: sin esto el template no se dibuja nunca. */
function wireSpellCheckContextMenu(win: BrowserWindow): void {
  const webContents = win.webContents;
  webContents.on('context-menu', (_event, params) => {
    const template = buildContextMenuTemplate(params, {
      replaceMisspelling: (word) => webContents.replaceMisspelling(word),
      addToDictionary: (word) => webContents.session.addWordToSpellCheckerDictionary(word),
    });
    if (template.length === 0) return;
    Menu.buildFromTemplate(template).popup({ window: win });
  });
}
