import { describe, it, expect } from "vitest";
import { playerLevelFromXp, xpToReachLevel } from "../player-level";

describe("xpToReachLevel", () => {
  it("el nivel 1 arranca en 0 XP", () => {
    expect(xpToReachLevel(1)).toBe(0);
  });

  it("sigue la curva 50·n·(n−1)", () => {
    expect(xpToReachLevel(2)).toBe(100);
    expect(xpToReachLevel(3)).toBe(300);
    expect(xpToReachLevel(5)).toBe(1000);
  });
});

describe("playerLevelFromXp", () => {
  it("con 0 XP es nivel 1 sin progreso", () => {
    expect(playerLevelFromXp(0)).toEqual({
      level: 1,
      title: "Newcomer",
      totalXp: 0,
      xpIntoLevel: 0,
      xpForLevel: 100,
      progress: 0,
    });
  });

  it("calcula el avance dentro del nivel", () => {
    const p = playerLevelFromXp(150);
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(50);
    expect(p.xpForLevel).toBe(200);
    expect(p.progress).toBeCloseTo(0.25);
  });

  it("justo en el umbral ya es el nivel siguiente", () => {
    expect(playerLevelFromXp(300).level).toBe(3);
    expect(playerLevelFromXp(299).level).toBe(2);
  });

  it("trata XP negativo como cero", () => {
    expect(playerLevelFromXp(-40).level).toBe(1);
  });

  it("después del último título usa Legend", () => {
    expect(playerLevelFromXp(1_000_000).title).toBe("Legend");
  });
});
