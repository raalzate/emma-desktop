/**
 * Interruptor «Conversation replies in the cloud» (#348, T3): texto en inglés,
 * tooltip en español que dice qué sale del equipo (Artículo 9), y los campos de
 * proveedor y llave visibles aunque el modo sea local.
 */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RemoteAiConfig } from "../remote-ai-config";

describe("RemoteAiConfig · respuestas en la nube", () => {
  const html = renderToStaticMarkup(createElement(RemoteAiConfig));

  it("ofrece el interruptor en inglés", () => {
    expect(html).toContain("Conversation replies in the cloud");
    expect(html).toContain('id="ai-reply-cloud"');
  });

  it("el tooltip en español dice qué sale del equipo y qué no", () => {
    const title = html.match(/id="ai-reply-cloud"[^>]*title="([^"]+)"|title="([^"]+)"[^>]*id="ai-reply-cloud"/);
    const text = title?.[1] ?? title?.[2] ?? "";
    expect(text).toMatch(/nube/);
    expect(text).toMatch(/gramática|sugerencias|voz/);
  });

  it("el hook expone setReplyInCloud y lo persiste", async () => {
    const fs = await import("node:fs");
    const hook = fs.readFileSync("src/components/settings/use-remote-ai.ts", "utf8");
    expect(hook).toMatch(/setReplyInCloud = \(replyInCloud: boolean\) => persist\(\{ \.\.\.settings, replyInCloud \}\)/);
  });
});
