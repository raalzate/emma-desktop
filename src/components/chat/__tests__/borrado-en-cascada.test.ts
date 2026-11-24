/** T30 — borrar una conversación borra también sus clips de audio (FR-022, SC-002). */

import { describe, expect, it } from "vitest";
import { deleteConversation } from "../delete-conversation";

function armar(over: { removeFails?: boolean; audioFails?: boolean } = {}) {
  const orden: string[] = [];
  return {
    orden,
    history: {
      remove: async (id: string) => {
        orden.push(`history:${id}`);
        if (over.removeFails) throw new Error("no se pudo borrar");
      },
    },
    audio: {
      removeConversation: async (id: string) => {
        orden.push(`audio:${id}`);
        if (over.audioFails) throw new Error("disco");
        return 3;
      },
    },
  };
}

describe("deleteConversation", () => {
  it("borra el historial y DESPUÉS los clips de esa conversación", async () => {
    const { history, audio, orden } = armar();
    await deleteConversation({ id: "c1", history, audio });
    expect(orden).toEqual(["history:c1", "audio:c1"]);
  });

  it("si falla el historial, no toca el audio y propaga el error", async () => {
    const { history, audio, orden } = armar({ removeFails: true });
    await expect(deleteConversation({ id: "c1", history, audio })).rejects.toThrow("no se pudo borrar");
    expect(orden).toEqual(["history:c1"]);
  });

  it("si falla el audio, la conversación ya está borrada: avisa por onError sin romper", async () => {
    const { history, audio } = armar({ audioFails: true });
    const errores: unknown[] = [];
    await deleteConversation({ id: "c1", history, audio, onError: (e) => errores.push(e) });
    expect(errores).toHaveLength(1);
  });
});
