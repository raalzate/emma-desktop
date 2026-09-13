/**
 * INCIDENTE (ruido que tapa el síntoma): la cadena de carga de producción era
 * `appServe(win).then(() => win.loadURL('app://-'))` sin `.catch`. Cuando la
 * sonda del smoke llama a `app.exit()`, Electron aborta la carga en curso y esa
 * promesa se rechaza: el smoke imprimía
 * `UnhandledPromiseRejectionWarning: Error: ERR_FAILED (-2) loading 'app://-'`
 * en cada corrida VERDE — el mismo texto exacto que saldría si `app://-`
 * estuviera realmente roto (release v0.1.0, ventana blanca). Un aviso que
 * aparece siempre no avisa de nada, y encima un fallo de `appServe` se perdía
 * en silencio.
 *
 * El freno vive aquí y no en el smoke: con la salida tuberiada el aviso de Node
 * se pierde al salir, así que un chequeo sobre el log daría verde justo cuando
 * importa.
 */

import { describe, expect, it, vi } from "vitest";
import { loadProductionRenderer } from "../load-renderer";

function ventanaFalsa(loadURL: () => Promise<void>) {
  return { loadURL, isDestroyed: () => false } as unknown as Parameters<
    typeof loadProductionRenderer
  >[0];
}

describe("loadProductionRenderer", () => {
  it("un rechazo de loadURL no escapa como promesa sin manejar", async () => {
    const log = vi.fn();
    await expect(
      loadProductionRenderer(
        ventanaFalsa(() => Promise.reject(new Error("ERR_FAILED (-2) loading 'app://-'"))),
        async () => {},
        log,
      ),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toContain("ERR_FAILED");
  });

  it("un fallo de appServe se reporta en vez de perderse en silencio", async () => {
    const log = vi.fn();
    await loadProductionRenderer(
      ventanaFalsa(async () => {}),
      async () => {
        throw new Error("directory not found");
      },
      log,
    );
    expect(log.mock.calls[0][0]).toContain("directory not found");
  });

  it("la ventana ya destruida no ensucia el log: salir no es un fallo", async () => {
    const log = vi.fn();
    const win = {
      loadURL: () => Promise.reject(new Error("ERR_FAILED (-2) loading 'app://-'")),
      isDestroyed: () => true,
    } as unknown as Parameters<typeof loadProductionRenderer>[0];
    await loadProductionRenderer(win, async () => {}, log);
    expect(log).not.toHaveBeenCalled();
  });

  it("el camino feliz carga app://- después de montar el servidor", async () => {
    const orden: string[] = [];
    const log = vi.fn();
    await loadProductionRenderer(
      ventanaFalsa(async () => {
        orden.push("loadURL");
      }),
      async () => {
        orden.push("serve");
      },
      log,
    );
    expect(orden).toEqual(["serve", "loadURL"]);
    expect(log).not.toHaveBeenCalled();
  });
});
