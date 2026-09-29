/**
 * Estilo mensajería (WhatsApp de escritorio): el hilo ocupa todo el ancho del
 * panel, las burbujas abrazan su contenido y llevan la hora dentro, y el turno
 * del aprendiz muestra el doble check de «enviado». Sin columna centrada.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { UserBubble } from "@/components/chat/user-bubble";

const src = (f: string) => readFileSync(`src/components/chat/${f}`, "utf8");

describe("Chat estilo mensajería", () => {
  it("el hilo y el composer no se centran en una columna estrecha", () => {
    expect(src("message-list.tsx")).not.toContain("max-w-2xl");
    expect(src("composer.tsx")).not.toContain("max-w-2xl");
  });

  it("el hilo tiene fondo texturado como el papel tapiz de un chat", () => {
    expect(src("message-list.tsx")).toContain("radial-gradient");
  });

  it("la burbuja del aprendiz lleva la hora dentro con doble check", () => {
    const html = renderToStaticMarkup(
      createElement(UserBubble, { text: "Sure, I can do that.", at: Date.UTC(2026, 8, 25, 15, 4) }),
    );
    expect(html).toContain("w-fit");
    expect(html).toContain("lucide-check-check");
    // La hora va dentro de la caja de la burbuja, después del texto: la burbuja
    // (rounded-br) se cierra DESPUÉS del span mono con la hora.
    const burbuja = html.indexOf("rounded-br-[4px]");
    const hora = html.indexOf("font-code");
    const cierre = html.lastIndexOf("</div></div>");
    expect(burbuja).toBeGreaterThan(-1);
    expect(hora).toBeGreaterThan(burbuja);
    expect(cierre).toBeGreaterThan(hora);
  });

  it("la burbuja de Emma no repite avatar en cada turno y abraza el texto", () => {
    const s = src("emma-bubble.tsx");
    expect(s).not.toContain("<Avatar");
    expect(s).toContain("w-fit");
  });

  it("la cabecera muestra el avatar de la persona junto al nombre", () => {
    expect(src("chat-header.tsx")).toMatch(/rounded-full[^"]*bg-accent/);
  });
});
