/**
 * Rastro de cierres (#245): cuando un proceso del renderer o un hijo (GPU,
 * utilidad) muere, queda en el log con `reason` y `exitCode`. Sin esto un
 * cierre inesperado no dejaba ninguna pista. Los emisores entran por argumento
 * para probarlo sin Electron.
 */

interface Emisor {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
}

export interface CrashTraceDeps {
  app: Emisor;
  webContents: Emisor;
  log: (line: string) => void;
}

/** Campos de interés del detalle del evento; tolera ausentes o mal formados. */
function describe(details: unknown): string {
  const d = (details && typeof details === "object" ? details : {}) as Record<string, unknown>;
  const campo = (key: string) => (d[key] === undefined ? "?" : String(d[key]));
  const extra = d.type !== undefined ? ` type=${campo("type")} name=${campo("name")}` : "";
  return `reason=${campo("reason")} exitCode=${campo("exitCode")}${extra}`;
}

/** Por ventana: el renderer murió. */
export function traceRenderer(webContents: Emisor, log: (line: string) => void): void {
  webContents.on("render-process-gone", (_event, details) =>
    log(`[render-process-gone] ${describe(details)}`),
  );
}

/** Una vez por app: murió un proceso hijo (GPU, utilidad...). */
export function traceChildProcesses(app: Emisor, log: (line: string) => void): void {
  app.on("child-process-gone", (_event, details) =>
    log(`[child-process-gone] ${describe(details)}`),
  );
}

export function registerCrashTrace({ app, webContents, log }: CrashTraceDeps): void {
  traceRenderer(webContents, log);
  traceChildProcesses(app, log);
}
