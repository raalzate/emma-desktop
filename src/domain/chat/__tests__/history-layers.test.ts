import { describe, it, expect } from "vitest";
import { layerHistory } from "../history-layers";
import type { ChatTurn } from "../simulation-session";

const t = (role: "user" | "assistant", content: string): ChatTurn => ({ role, content });

describe("layerHistory — capas de contexto (BUG-001)", () => {
  it("historial corto viaja completo sin nota", () => {
    const history = [t("assistant", "Hey Raul, what's up?"), t("user", "I am fine.")];
    expect(layerHistory(history)).toEqual({ note: null, turns: history });
  });

  it("el smalltalk viejo se colapsa en una nota; lo sustantivo viejo se conserva", () => {
    const history = [
      t("assistant", "Good morning! what's up?"),
      t("user", "I am fine, thank you. How are you?"),
      t("assistant", "I'm doing well, thank you! what about you?"),
      t("user", "I finished the report for Project Alpha."),
      t("assistant", "Great, what's next?"),
      t("user", "I need to finish the report by Friday."),
      t("assistant", "Got it — anything blocking you?"),
      t("user", "No blockers, everything is on track."),
    ];
    const layered = layerHistory(history);
    expect(layered.note).toMatch(/small talk/i);
    const contents = layered.turns.map((x) => x.content);
    expect(contents).not.toContain("Good morning! what's up?");
    expect(contents).not.toContain("I am fine, thank you. How are you?");
    expect(contents).toContain("I finished the report for Project Alpha.");
    expect(contents).toContain("No blockers, everything is on track.");
  });

  it("los últimos 4 turnos viajan verbatim aunque sean relleno", () => {
    const history = [
      t("assistant", "What did you do yesterday?"),
      t("user", "I finished the login API."),
      t("assistant", "Nice!"),
      t("user", "yeah"),
      t("assistant", "And today?"),
      t("user", "ok"),
    ];
    const layered = layerHistory(history);
    const contents = layered.turns.map((x) => x.content);
    expect(contents).toContain("yeah");
    expect(contents).toContain("ok");
  });

  it("acota los turnos viejos: el prompt no puede crecer con la escena", () => {
    const largo = Array.from({ length: 40 }, (_, i) =>
      t(i % 2 === 0 ? "assistant" : "user", `Substantive work detail number ${i}.`),
    );
    const layered = layerHistory(largo);
    expect(layered.turns.length).toBeLessThanOrEqual(8);
  });

  it("al recortar por tope conserva los turnos viejos MÁS RECIENTES", () => {
    const largo = Array.from({ length: 40 }, (_, i) =>
      t(i % 2 === 0 ? "assistant" : "user", `Substantive work detail number ${i}.`),
    );
    const contents = layerHistory(largo).turns.map((x) => x.content);
    expect(contents).toContain("Substantive work detail number 39.");
    expect(contents).not.toContain("Substantive work detail number 0.");
  });

  it("avisa cuando se recortó por tope, no sólo por smalltalk", () => {
    const largo = Array.from({ length: 40 }, (_, i) =>
      t(i % 2 === 0 ? "assistant" : "user", `Substantive work detail number ${i}.`),
    );
    expect(layerHistory(largo).note).toBeTruthy();
  });
});
