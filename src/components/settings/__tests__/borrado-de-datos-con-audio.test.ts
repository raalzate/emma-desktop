/** T30 — «Clear chat history» y «Delete all data» también borran el audio (FR-022, SC-002). */

import { describe, expect, it } from "vitest";
import { ALL_COLLECTIONS, clearChatHistory, deleteAllData } from "../data-clearing";

function armar(audioFails = false) {
  const orden: string[] = [];
  return {
    orden,
    clear: async (keys: string[]) => void orden.push(`clear:${keys.join(",")}`),
    audio: {
      removeAll: async () => {
        orden.push("audio:removeAll");
        if (audioFails) throw new Error("disco");
      },
    },
  };
}

describe("clearChatHistory", () => {
  it("vacía las conversaciones y los clips de audio", async () => {
    const { clear, audio, orden } = armar();
    await clearChatHistory({ clear, audio });
    expect(orden).toEqual(["clear:chatConversations", "audio:removeAll"]);
  });

  it("si el audio no se pudo borrar, el error llega a quien llama (el toast)", async () => {
    const { clear, audio } = armar(true);
    await expect(clearChatHistory({ clear, audio })).rejects.toThrow("disco");
  });
});

describe("deleteAllData", () => {
  it("vacía todas las colecciones y el audio", async () => {
    const { clear, audio, orden } = armar();
    await deleteAllData({ clear, audio });
    expect(orden).toEqual([`clear:${ALL_COLLECTIONS.join(",")}`, "audio:removeAll"]);
  });

  it("incluye los chequeos de setup y las preferencias de audio", () => {
    expect(ALL_COLLECTIONS).toEqual(expect.arrayContaining(["setupChecks", "audioPrefs", "chatConversations"]));
  });
});
