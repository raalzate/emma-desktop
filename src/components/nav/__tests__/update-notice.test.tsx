/**
 * #383 — el aviso de versión nueva se ve fuera de Ajustes y lleva a Ajustes.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { UpdateStatus } from "@/domain/updates/update-status";

let mockStatus: UpdateStatus | null = null;
vi.mock("@/components/settings/use-update-status", () => ({
  useUpdateStatus: () => mockStatus,
}));

async function render(status: UpdateStatus | null): Promise<string> {
  mockStatus = status;
  const { UpdateNotice } = await import("@/components/nav/update-notice");
  return renderToStaticMarkup(createElement(UpdateNotice));
}

describe("UpdateNotice", () => {
  it("con una versión disponible, avisa en inglés y abre la pestaña System de Ajustes", async () => {
    const html = await render({ state: "available", version: "0.13.2", action: "manual" });
    expect(html).toContain("EMMA 0.13.2 is available");
    // La tarjeta Updates vive en System: sin la pestaña, Ajustes abre en «Emma (tutor)».
    expect(html).toMatch(/href="\/settings\/?\?tab=system"/);
    expect(html).toContain('title="Hay una versión nueva de EMMA (0.13.2)');
  });

  it("con la descarga lista, invita a instalar", async () => {
    expect(await render({ state: "ready", version: "0.13.2" })).toContain("EMMA 0.13.2 ready to install");
  });

  it("al día o sin estado, no muestra nada", async () => {
    expect(await render({ state: "none", version: "0.13.2" })).toBe("");
    expect(await render(null)).toBe("");
  });
});
