import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AudioClipMeta } from "@/domain/audio/audio-clip";
import { AudioStorageView, type AudioStorageViewProps } from "@/components/settings/audio-storage-view";

const noop = () => {};
const base: AudioStorageViewProps = {
  usage: { count: 3, bytes: 2 * 1024 * 1024 },
  groups: [{ conversationId: "c1", count: 2, bytes: 1024 * 1024 }, { conversationId: null, count: 1, bytes: 1024 * 1024 }],
  capBytes: 100 * 1024 * 1024,
  capInput: "500",
  capError: null,
  busy: false,
  clips: [], expandedKeys: [], playingId: null,
  onToggleGroup: noop, onPlayClip: noop, onRemoveClip: noop,
  onCapInput: noop, onSaveCap: noop, onRemoveConversation: noop, onRemoveAll: noop,
};
const render = (p: Partial<AudioStorageViewProps> = {}) => renderToStaticMarkup(createElement(AudioStorageView, { ...base, ...p }));

describe("AudioStorageView", () => {
  it("muestra conteo y megas usados", () => {
    const html = render();
    expect(html).toContain("3 clips");
    expect(html).toContain("2.0 MB");
  });

  it("la línea de uso incluye el tope y los clips chicos van en KB", () => {
    const html = render({ usage: { count: 1, bytes: 13 * 1024 }, groups: [] });
    expect(html).toContain("13 KB of 100 MB");
  });

  it("sin clips lo dice y no ofrece borrar todo", () => {
    const html = render({ usage: { count: 0, bytes: 0 }, groups: [] });
    expect(html).toContain("No saved audio yet");
    expect(html).not.toContain("Delete all audio");
  });

  it("el tope muestra el valor y el error de validación", () => {
    const html = render({ capInput: "10", capError: "The limit must be at least 50 MB." });
    expect(html).toContain('value="10"');
    expect(html).toContain("The limit must be at least 50 MB.");
  });

  it("cada acción destructiva y de guardado lleva tooltip en español", () => {
    const html = render();
    expect(html).toMatch(/title="[^"]*(Guarda|guarda)[^"]*"/);
    expect(html).toMatch(/title="[^"]*(Borra|borra)[^"]*"/);
  });

  describe("clips por grupo", () => {
    const clip = (id: string, origin: AudioClipMeta["origin"], text: string): AudioClipMeta => ({
      id, origin, text, conversationId: "c1", durationMs: 7000, bytes: 512 * 1024, createdAt: Date.UTC(2026, 10, 10),
    });
    const clips = [clip("k1", "emma", "How are you today?"), clip("k2", "learner", "I am fine")];

    it("colapsado: aria-expanded=false y sin clips visibles", () => {
      const html = render({ clips });
      expect(html).toContain('aria-expanded="false"');
      expect(html).not.toContain("How are you today?");
    });

    it("expandido: aria-expanded=true y lista texto, origen, duración, tamaño y fecha", () => {
      const html = render({ clips, expandedKeys: ["c1"] });
      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain("How are you today?");
      expect(html).toContain("EMMA");
      expect(html).toContain("Your voice");
      expect(html).toContain("0:07");
      expect(html).toContain("512 KB");
      expect(html).toContain("2026-11-10");
    });

    it("cada clip tiene botones de escuchar y borrar con tooltip en español", () => {
      const html = render({ clips, expandedKeys: ["c1"] });
      expect(html).toMatch(/title="Escucha este clip[^"]*"/);
      expect(html).toMatch(/title="Borra este clip[^"]*"/);
      expect(html.match(/aria-label="Play clip/g)).toHaveLength(2);
    });

    it("el clip en reproducción ofrece detener", () => {
      const html = render({ clips, expandedKeys: ["c1"], playingId: "k1" });
      expect(html).toMatch(/title="Detiene[^"]*"/);
    });
  });
});
