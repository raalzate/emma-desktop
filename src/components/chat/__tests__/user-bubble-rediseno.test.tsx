/**
 * FR-018 (rediseño «Café sereno»): la burbuja del aprendiz es azul (token
 * primary) con radio 16px y la esquina inferior derecha en 4px.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UserBubble } from "@/components/chat/user-bubble";

describe("UserBubble (rediseño Café sereno, FR-018)", () => {
  it("usa fondo primary y rounded-bubble con esquina inferior derecha 4px", () => {
    const html = renderToStaticMarkup(
      createElement(UserBubble, { text: "Hi! I'd like a cappuccino, please." }),
    );
    expect(html).toContain("bg-primary");
    expect(html).toContain("rounded-bubble");
    expect(html).toContain("rounded-br-[4px]");
    expect(html).not.toContain("rounded-2xl");
  });
});
