/**
 * FR-008 (T4): la barra lateral separa las conversaciones archivadas por subida
 * de nivel. Render estático (patrón de chat-header-rediseno.test.tsx): la sección
 * plegable es un <details> nativo, así que el markup basta.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatSidebar, archivedGroupLabel } from "@/components/chat/chat-sidebar";
import type { ChatConversation } from "@/domain/chat/chat-conversation";

const conv = (id: string, title: string, over: Partial<ChatConversation> = {}): ChatConversation => ({
  id, title, scenarioType: "daily_standup", level: "A1", messages: [], turnCount: 0,
  createdAt: 1, updatedAt: 1, ...over,
});
const archivada = (id: string, title: string, level: "A1" | "A2"): ChatConversation =>
  conv(id, title, { level, archived: { level, at: "2026-10-09T10:00:00.000Z" } });

function render(list: ChatConversation[]): string {
  return renderToStaticMarkup(
    createElement(ChatSidebar, {
      list, activeId: null, onNew: () => {}, onOpen: () => {}, onRename: () => {}, onDelete: () => {},
    }),
  );
}

describe("ChatSidebar — archivadas", () => {
  it("la lista principal no incluye las archivadas", () => {
    const html = render([conv("1", "Activa uno"), archivada("2", "Vieja dos", "A1")]);
    const principal = html.split("<details")[0];
    expect(principal).toContain("Activa uno");
    expect(principal).not.toContain("Vieja dos");
  });

  it("muestra una sección plegable «Archived» agrupada por nivel", () => {
    const html = render([archivada("2", "Vieja dos", "A1"), archivada("3", "Vieja tres", "A2")]);
    expect(html).toContain("<details");
    expect(html).toContain("Archived");
    expect(html).toContain("Level 1");
    expect(html).toContain("Level 2");
    expect(html).not.toMatch(/\b(A1|A2)\b/);
    expect(html).toContain(archivedGroupLabel("A1"));
    expect(html).toContain(archivedGroupLabel("A2"));
    expect(html).toContain("Vieja dos");
    expect(html).toContain("Vieja tres");
  });

  it("sin archivadas no pinta la sección", () => {
    expect(render([conv("1", "Activa")])).not.toContain("Archived");
  });

  it("las archivadas se pueden renombrar y borrar, con tooltip en español", () => {
    const html = render([archivada("2", "Vieja dos", "A1")]);
    expect(html).toContain('aria-label="Rename"');
    expect(html).toContain('aria-label="Delete"');
    expect(html).toContain('title="Ponle un nombre que te ayude a encontrar esta conversación"');
    expect(html).toContain('title="Borra esta conversación de forma permanente"');
  });

  it("el rótulo del grupo pasa por una única función", () => {
    expect(archivedGroupLabel("B1")).toBe("Level 3");
  });
});
