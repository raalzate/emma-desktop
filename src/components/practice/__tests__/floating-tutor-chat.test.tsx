/**
 * Chat flotante con EMMA en la práctica (#357, T8): botón abajo a la derecha,
 * panel de texto por defecto y opción de que lea las respuestas en voz alta.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import { FloatingTutorChat } from "@/components/practice/floating-tutor-chat";

const ask = async () => "ok";

describe("FloatingTutorChat", () => {
  it("cerrado: un botón flotante abajo a la derecha, con tooltip en español", () => {
    const html = renderToStaticMarkup(<FloatingTutorChat ask={ask} />);
    expect(html).toMatch(/fixed[^"]*bottom-6[^"]*right-6/);
    expect(html).toContain('aria-label="Ask EMMA"');
    expect(html).toMatch(/title="[^"]*(Pregúntale|EMMA)[^"]*"/);
  });

  it("abierto: texto por defecto, opción de audio apagada, todo con tooltip", () => {
    const html = renderToStaticMarkup(<FloatingTutorChat ask={ask} initialOpen />);
    expect(html).toContain("Ask EMMA to translate or explain");
    expect(html).toContain("Read replies aloud");
    expect(html).toMatch(/aria-checked="false"|data-state="unchecked"/);
    const buttons = html.match(/<button[^>]*>/g) ?? [];
    for (const b of buttons) expect(b).toMatch(/title="/);
  });

  it("se monta en todas las rutas de práctica", () => {
    expect(fs.readFileSync("src/components/practice/practice-route-shell.tsx", "utf8")).toMatch(/<FloatingTutorChat/);
  });
});
