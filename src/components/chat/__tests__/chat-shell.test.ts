/**
 * Rediseño «Café sereno», integración del chat con el shell: UNA sola sidebar.
 * ChatView envuelve el panel en AppShell y pasa la lista de sesiones por la
 * ranura `extra`; ChatSidebar deja de ser un <aside> propio y se convierte en
 * la sección «SESIONES» dentro de la sidebar del shell.
 *
 * Aserción sobre el fuente: montar ChatView exige runtime completo de Emma;
 * lo que se fija aquí es el cableado y las clases, no el comportamiento (que
 * conservan sus hooks intactos).
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const leer = (relativo: string) =>
  fs.readFileSync(path.join(process.cwd(), "src/components/chat", relativo), "utf8");

describe("chat dentro del AppShell (rediseño Café sereno)", () => {
  it("ChatView envuelve en AppShell y pasa la lista de sesiones como extra", () => {
    const src = leer("chat-view.tsx");
    expect(src).toContain('from "@/components/nav/app-shell"');
    expect(src).toContain("<AppShell");
    expect(src).toMatch(/extra=\{\s*<ChatSidebar/);
  });

  it("ChatSidebar ya no es un aside con ancho propio (la sidebar la pone el shell)", () => {
    const src = leer("chat-sidebar.tsx");
    expect(src).not.toContain("<aside");
    expect(src).not.toContain("w-64");
    expect(src).not.toContain("h-screen");
  });

  it("ChatSidebar rotula la sección con el label mono «SESIONES»", () => {
    const src = leer("chat-sidebar.tsx");
    expect(src).toContain("SESIONES");
    expect(src).toContain("font-code");
  });

  it("el item activo lleva fondo secundario y borde", () => {
    const src = leer("chat-sidebar.tsx");
    // El condicional y sus clases pueden repartirse en varias líneas (cn).
    expect(src).toMatch(/activeId === c\.id[\s\S]{0,160}bg-secondary/);
    expect(src).toMatch(/activeId === c\.id[\s\S]{0,160}border-border/);
  });

  it("ChatPane ocupa el alto del shell, no de la pantalla", () => {
    const src = leer("chat-pane.tsx");
    expect(src).not.toContain("h-screen");
    expect(src).toContain("h-full");
  });

  it("la página de chat muestra el esqueleto de carga dentro del shell", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/app/chat/page.tsx"), "utf8");
    expect(src).toContain('from "@/components/nav/app-shell"');
  });
});
