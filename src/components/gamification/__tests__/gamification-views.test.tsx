import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { summarizeGamification } from "@/domain/gamification/gamification-summary";
import { ACHIEVEMENTS } from "@/domain/gamification/achievements";
import { playerLevelFromXp } from "@/domain/gamification/player-level";
import type { XpEvent } from "@/domain/gamification/xp-event";
import { PlayerCardView } from "../player-card";
import { GamificationPanelView } from "../gamification-panel";
import { CelebrationLayerView } from "../celebration-layer";
import { WeeklyXpChart, weekdayOf } from "../weekly-xp-chart";
import { confettiPieces } from "../confetti";
import { XpBreakdown } from "../xp-breakdown";

const TODAY = 20_000;
const events: XpEvent[] = [
  { kind: "conversation", xp: 40, day: TODAY - 1, at: 1, clean: true },
  { kind: "review", xp: 3, day: TODAY, at: 2 },
  { kind: "exercise", xp: 120, day: TODAY, at: 3 },
];
const summary = summarizeGamification(events, TODAY);

const html = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(el);

describe("PlayerCardView", () => {
  const out = html(createElement(PlayerCardView, { summary }));

  it("muestra nivel, título y XP dentro del nivel", () => {
    expect(out).toContain(">2<");
    expect(out).toContain(summary.level.title);
    expect(out).toContain(`${summary.level.xpIntoLevel} / ${summary.level.xpForLevel} XP`);
  });

  it("muestra la racha con la llama animada y la meta del día", () => {
    expect(out).toContain("animate-flame-flicker");
    expect(out).toContain("123/50 today");
  });

  it("lleva a Progreso con tooltip en español", () => {
    expect(out).toContain('href="/progress"');
    expect(out).toMatch(/title="Tu nivel de jugador/);
  });
});

describe("GamificationPanelView", () => {
  const out = html(createElement(GamificationPanelView, { summary }));

  it("pinta el anillo de nivel, el XP total y la racha", () => {
    expect(out).toContain("Your journey");
    expect(out).toContain('role="progressbar"');
    expect(out).toContain("163");
    expect(out).toContain("day streak");
  });

  it("celebra la meta diaria cumplida", () => {
    expect(out).toContain("Goal reached!");
    expect(out).toContain("animate-glow-pulse");
  });

  it("incluye la semana y todos los logros con su avance", () => {
    expect(out).toContain("This week · 163 XP");
    expect(out).toContain(`Achievements · 2/${ACHIEVEMENTS.length}`);
    for (const a of ACHIEVEMENTS) expect(out).toContain(a.title);
  });

  it("las animaciones van detrás de motion-safe", () => {
    expect(out).toContain("motion-safe:animate-bar-grow");
    expect(out).toContain("motion-safe:animate-shine");
  });
});

describe("CelebrationLayerView", () => {
  const noop = () => undefined;

  it("sin premios no pinta nada visible", () => {
    const out = html(
      createElement(CelebrationLayerView, { floats: [], toasts: [], levelUp: null, onCloseToast: noop, onCloseLevelUp: noop }),
    );
    expect(out).not.toContain("XP");
    expect(out).not.toContain("Level up");
  });

  it("muestra el +XP flotante y la meta cumplida", () => {
    const out = html(
      createElement(CelebrationLayerView, {
        floats: [{ id: 1, xp: 25, goalMet: true }],
        toasts: [],
        levelUp: null,
        onCloseToast: noop,
        onCloseLevelUp: noop,
      }),
    );
    expect(out).toContain("+25 XP");
    expect(out).toContain("Daily goal reached!");
    expect(out).toContain("motion-safe:animate-xp-float");
  });

  it("anuncia el logro desbloqueado con su rango", () => {
    const out = html(
      createElement(CelebrationLayerView, {
        floats: [],
        toasts: [{ id: 2, achievement: ACHIEVEMENTS[0] }],
        levelUp: null,
        onCloseToast: noop,
        onCloseLevelUp: noop,
      }),
    );
    expect(out).toContain("Achievement unlocked");
    expect(out).toContain(ACHIEVEMENTS[0].title);
    expect(out).toMatch(/title="Cerrar el aviso del logro"/);
  });

  it("al subir de nivel muestra la tarjeta con confeti", () => {
    const out = html(
      createElement(CelebrationLayerView, {
        floats: [],
        toasts: [],
        levelUp: playerLevelFromXp(300),
        onCloseToast: noop,
        onCloseLevelUp: noop,
      }),
    );
    expect(out).toContain("Level up!");
    expect(out).toContain("Speaker");
    expect(out).toContain("animate-confetti-fall");
    expect(out).toContain("Keep going");
  });
});

describe("WeeklyXpChart", () => {
  it("nombra los días y marca hoy", () => {
    const out = html(createElement(WeeklyXpChart, { week: summary.week, goal: 50 }));
    expect(out).toContain("Today");
    expect(out).toContain("goal 50");
    expect(out.match(/animate-bar-grow/g)).toHaveLength(7);
  });

  it("weekdayOf lee el día local en UTC", () => {
    // 1970-01-01 fue jueves.
    expect(weekdayOf(0)).toBe("Thu");
    expect(weekdayOf(3)).toBe("Sun");
  });
});

describe("confettiPieces", () => {
  it("es determinista y usa sólo tokens del tema", () => {
    expect(confettiPieces(10)).toEqual(confettiPieces(10));
    for (const p of confettiPieces(40)) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThan(100);
      expect(p.color).toMatch(/^bg-(primary|accent|scaffold-easy|scaffold-hard|cat-\d)$/);
    }
  });
});

describe("XpBreakdown", () => {
  it("lista cada línea y el total", () => {
    const out = html(
      createElement(XpBreakdown, {
        lines: [
          { label: "Conversation", xp: 20 },
          { label: "Clean session", xp: 10 },
        ],
        total: 30,
      }),
    );
    expect(out).toContain("XP earned");
    expect(out).toContain("Clean session");
    expect(out).toContain("30");
  });

  it("sin líneas no pinta nada", () => {
    expect(html(createElement(XpBreakdown, { lines: [], total: 0 }))).toBe("");
  });
});
