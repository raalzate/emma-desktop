import { describe, expect, it } from "vitest";
import { CATEGORY_VISUALS, visualFor } from "@/components/progress/category-visuals";

describe("CATEGORY_VISUALS (rediseño Café sereno, FR-029)", () => {
  const visuals = Object.values(CATEGORY_VISUALS);

  it("cubre las cinco categorías del catálogo", () => {
    expect(Object.keys(CATEGORY_VISUALS)).toHaveLength(5);
  });

  it("cada campo de color resuelve a un token cat-1…cat-5", () => {
    for (const visual of visuals) {
      expect(visual.border).toMatch(/^border-cat-[1-5]$/);
      expect(visual.text).toMatch(/^text-cat-[1-5]$/);
      expect(visual.fill).toMatch(/^bg-cat-[1-5] /);
      expect(visual.ring).toMatch(/^ring-cat-[1-5]\//);
      expect(visual.stroke).toMatch(/^stroke-cat-[1-5]\//);
    }
  });

  it("no queda ninguna clase de paleta cruda de Tailwind", () => {
    const serializado = JSON.stringify(
      visuals.map(({ icon: _icon, ...clases }) => clases),
    );
    expect(serializado).not.toMatch(/sky-|violet-|amber-|emerald-|rose-/);
  });

  it("las 5 categorías siguen siendo distinguibles entre sí", () => {
    const bordes = new Set(visuals.map((v) => v.border));
    expect(bordes.size).toBe(5);
  });

  it("visualFor cae a la categoría por defecto ante categorías desconocidas", () => {
    expect(visualFor(undefined)).toBe(CATEGORY_VISUALS.COLLABORATIVE_WORK);
    expect(visualFor("NO_EXISTE")).toBe(CATEGORY_VISUALS.COLLABORATIVE_WORK);
  });
});
