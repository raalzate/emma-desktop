/**
 * Carga del renderer de PRODUCCIÓN (electron-serve + `app://-`) con su manejo
 * de errores.
 *
 * El "why": la cadena vivía inline en `createMainWindow` como
 * `appServe(win).then(() => win.loadURL('app://-'))`, sin `.catch`. Dos costos:
 * un fallo de `appServe` desaparecía en silencio, y al salir (la sonda del
 * smoke llama a `app.exit()`) Electron aborta la carga en curso y el rechazo
 * salía impreso como `UnhandledPromiseRejectionWarning: ERR_FAILED (-2)` en
 * cada corrida verde — indistinguible de `app://-` realmente roto, que es el
 * incidente de la ventana blanca de v0.1.0. Aislada acá, se puede probar sin
 * Electron.
 */

/** Lo mínimo que necesitamos de BrowserWindow (así el test no monta Electron). */
export interface CargableWindow {
  loadURL(url: string): Promise<void>;
  isDestroyed(): boolean;
}

/** URL que sirve electron-serve para el export estático de Next. */
export const PRODUCTION_URL = "app://-";

/**
 * Monta el servidor estático y carga `app://-`. Nunca rechaza: un fallo real se
 * reporta (y el `did-fail-load` de la ventana es el que decide el veredicto del
 * smoke); un rechazo con la ventana ya destruida es el teardown normal al salir
 * y no se registra.
 */
// Genérica en la ventana a propósito: `electron-serve` exige un BrowserWindow
// completo, y el test necesita pasar un doble con lo mínimo (CargableWindow).
export async function loadProductionRenderer<W extends CargableWindow>(
  win: W,
  serve: (win: W) => Promise<void>,
  log: (message: string) => void = console.error,
): Promise<void> {
  try {
    await serve(win);
    await win.loadURL(PRODUCTION_URL);
  } catch (error) {
    if (win.isDestroyed()) return;
    log(`[carga] no se pudo cargar ${PRODUCTION_URL}: ${(error as Error).message}`);
  }
}
