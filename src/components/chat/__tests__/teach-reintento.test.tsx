import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TeachError } from "@/components/chat/teach-panel";

describe("Teach me — error con reintento", () => {
  const html = renderToStaticMarkup(createElement(TeachError, { onRetry: vi.fn() }));

  it("conserva el texto del error", () => {
    expect(html).toContain("The explanation couldn’t be generated. Please try again.");
  });

  it("ofrece «Try again» con tooltip en español", () => {
    expect(html).toContain("Try again");
    expect(html).toContain('title="Volver a pedir la explicación"');
  });

  it("el panel aborta la llamada al cerrar o cambiar de texto", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/components/chat/teach-panel.tsx"), "utf8");
    expect(src).toContain("new AbortController()");
    expect(src).toContain("signal: controller.signal");
    expect(src).toContain("controller.abort()");
  });
});
