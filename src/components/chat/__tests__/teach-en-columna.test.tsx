import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SidePanel } from "@/components/chat/side-panel";

const leer = (archivo: string) =>
  fs.readFileSync(path.join(process.cwd(), "src/components/chat", archivo), "utf8");

describe("SidePanel — columna lateral junto al chat", () => {
  const html = renderToStaticMarkup(
    createElement(SidePanel, { title: "Teach me", onClose: vi.fn(), children: createElement("p", null, "contenido") }),
  );

  it("es una columna complementaria, no un modal", () => {
    expect(html).toContain("<aside");
    expect(html).not.toContain('role="dialog"');
  });

  it("muestra el título y el contenido", () => {
    expect(html).toContain("Teach me");
    expect(html).toContain("contenido");
  });

  it("el botón de cierre lleva tooltip en español", () => {
    expect(html).toContain('title="Cerrar el panel"');
  });
});

describe("Teach me se abre en columna, no en modal", () => {
  it("teach-panel no usa el Dialog", () => {
    expect(leer("teach-panel.tsx")).not.toContain("@/components/ui/dialog");
    expect(leer("teach-panel.tsx")).toContain("SidePanel");
  });

  it("chat-pane monta el panel al lado del chat", () => {
    const src = leer("chat-pane.tsx");
    expect(src).toContain("<TeachPanel");
    expect(src).not.toContain("TeachDialog");
  });
});
