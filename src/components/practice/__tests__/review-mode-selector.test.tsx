/** Selector Text / Audio / Mixed con conteo (FR-010). */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewModeSelector } from "@/components/practice/review-mode-selector";

const counts = { text: 4, audio: 2, mixed: 6 };

describe("ReviewModeSelector", () => {
  it("muestra los tres modos con su conteo", () => {
    const html = renderToStaticMarkup(<ReviewModeSelector mode="text" counts={counts} onChange={() => {}} />);
    expect(html).toContain("Text (4)");
    expect(html).toContain("Audio (2)");
    expect(html).toContain("Mixed (6)");
  });

  it("marca como activo sólo el modo elegido", () => {
    const html = renderToStaticMarkup(<ReviewModeSelector mode="audio" counts={counts} onChange={() => {}} />);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Audio \(2\)/);
  });

  it("cada botón lleva tooltip en español", () => {
    const html = renderToStaticMarkup(<ReviewModeSelector mode="text" counts={counts} onChange={() => {}} />);
    expect(html.match(/title="/g)).toHaveLength(3);
  });
});
