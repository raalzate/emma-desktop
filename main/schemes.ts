import { protocol } from 'electron';

/**
 * Registro ÚNICO de schemes privilegiados (gana la última llamada). electron-serve
 * registra 'app' al importarse; esta función lo pisa declarando TODOS los schemes,
 * y DEBE invocarse tras los imports y antes de app.ready.
 *
 *  - 'app'          : renderer en producción. `secure` para exponer WebGPU (LiteRT-LM).
 *  - 'litert-model' : sirve los .litertlm locales (userData) con soporte de Range.
 */
export function registerPrivilegedSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        codeCache: true,
      },
    },
    {
      scheme: 'litert-model',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        bypassCSP: true,
      },
    },
  ]);
}
