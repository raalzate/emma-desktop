/**
 * La respuesta de Emma se ve mientras se genera (SC-001 de #323). El hook ya
 * acumulaba los tokens en `streaming`, pero ninguna vista los usaba: el
 * aprendiz miraba los tres puntos hasta el final de la generación.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { TypingIndicator } from "@/components/chat/typing-indicator";

const src = (f: string) => readFileSync(`src/components/chat/${f}`, "utf8");

describe("streaming visible", () => {
  it("sin texto, la burbuja muestra los tres puntos", () => {
    const html = renderToStaticMarkup(createElement(TypingIndicator, {}));
    expect(html).toContain('data-testid="emma-typing"');
    expect(html).toContain("animate-bounce");
  });

  it("con texto parcial, la burbuja muestra el texto en vez de los puntos", () => {
    const html = renderToStaticMarkup(createElement(TypingIndicator, { text: "So you finished the login" }));
    expect(html).toContain('data-testid="emma-streaming"');
    expect(html).toContain("So you finished the login");
    expect(html).not.toContain("animate-bounce");
  });

  it("la lista y el panel le pasan el streaming del hook a la burbuja", () => {
    expect(src("message-list.tsx")).toMatch(/<TypingIndicator text=\{streamingText\}/);
    expect(src("chat-pane.tsx")).toMatch(/streamingText=\{s\.streaming\}/);
  });
});

describe("selectores estables para el banco de evaluación (T4 de #323)", () => {
  it("las burbujas exponen data-testid y su texto", () => {
    expect(src("emma-bubble.tsx")).toMatch(/data-testid="emma-bubble"\s+data-text=\{text\}/);
    expect(src("user-bubble.tsx")).toMatch(/data-testid="user-bubble"\s+data-text=\{text\}/);
  });
});
