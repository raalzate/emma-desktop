import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AudioStorageView, type AudioStorageViewProps } from "@/components/settings/audio-storage-view";

const noop = () => {};
const base: AudioStorageViewProps = {
  usage: { count: 3, bytes: 2 * 1024 * 1024 },
  groups: [{ conversationId: "c1", count: 2, bytes: 1024 * 1024 }, { conversationId: null, count: 1, bytes: 1024 * 1024 }],
  capInput: "500",
  capError: null,
  busy: false,
  onCapInput: noop, onSaveCap: noop, onRemoveConversation: noop, onRemoveAll: noop,
};
const render = (p: Partial<AudioStorageViewProps> = {}) => renderToStaticMarkup(createElement(AudioStorageView, { ...base, ...p }));

describe("AudioStorageView", () => {
  it("muestra conteo y megas usados", () => {
    const html = render();
    expect(html).toContain("3 clips");
    expect(html).toContain("2.0 MB");
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
});
