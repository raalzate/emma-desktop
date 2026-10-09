import { describe, it, expect } from "vitest";
import { summarizeGamification, compareSummaries, DAILY_XP_GOAL } from "../gamification-summary";
import { statsFromEvents } from "../gamification-stats";
import { eventsFor, isXpEvent, type XpEvent } from "../xp-event";

function ev(over: Partial<XpEvent>): XpEvent {
  return { kind: "exercise", xp: 5, day: 100, at: 0, ...over };
}

describe("isXpEvent", () => {
  it("acepta un evento bien formado", () => {
    expect(isXpEvent(ev({}))).toBe(true);
    expect(isXpEvent(ev({ kind: "conversation", clean: true }))).toBe(true);
  });

  it.each([null, 3, "x", {}, { kind: "nope", xp: 1, day: 1, at: 1 }, { kind: "review", xp: "3", day: 1, at: 1 }])(
    "rechaza %o",
    (value) => {
      expect(isXpEvent(value)).toBe(false);
    },
  );

  it("rechaza XP negativo o no finito", () => {
    expect(isXpEvent(ev({ xp: -5 }))).toBe(false);
    expect(isXpEvent(ev({ xp: Number.NaN }))).toBe(false);
  });
});

describe("eventsFor", () => {
  it("convierte actividades en eventos con su XP, día y marca de sesión limpia", () => {
    const events = eventsFor(
      [
        { kind: "conversation", turns: 2, errors: 0 },
        { kind: "scenario-passed" },
      ],
      { at: 7, day: 3 },
    );
    expect(events).toEqual([
      { kind: "conversation", xp: 34, day: 3, at: 7, clean: true },
      { kind: "scenario-passed", xp: 30, day: 3, at: 7 },
    ]);
  });
});

describe("statsFromEvents", () => {
  it("agrega XP, conteos por tipo, sesiones limpias y rachas", () => {
    const s = statsFromEvents(
      [
        ev({ kind: "conversation", xp: 40, day: 99, clean: true }),
        ev({ kind: "conversation", xp: 30, day: 100 }),
        ev({ kind: "review", xp: 3, day: 100 }),
      ],
      100,
    );
    expect(s.totalXp).toBe(73);
    expect(s.counts.conversation).toBe(2);
    expect(s.counts.review).toBe(1);
    expect(s.counts.challenge).toBe(0);
    expect(s.cleanSessions).toBe(1);
    expect(s.currentStreak).toBe(2);
    expect(s.bestStreak).toBe(2);
  });
});

describe("summarizeGamification", () => {
  it("sin eventos devuelve un resumen vacío coherente", () => {
    const s = summarizeGamification([], 100);
    expect(s.totalXp).toBe(0);
    expect(s.level.level).toBe(1);
    expect(s.streak).toEqual({ current: 0, best: 0, activeToday: false });
    expect(s.dailyGoal).toEqual({ target: DAILY_XP_GOAL, earned: 0, progress: 0, met: false });
    expect(s.week).toHaveLength(7);
    expect(s.week.every((d) => d.xp === 0)).toBe(true);
  });

  it("arma la semana de los últimos 7 días, del más viejo a hoy", () => {
    const s = summarizeGamification([ev({ day: 94, xp: 9 }), ev({ day: 100, xp: 5 }), ev({ day: 93, xp: 50 })], 100);
    expect(s.week.map((d) => d.day)).toEqual([94, 95, 96, 97, 98, 99, 100]);
    expect(s.week[0].xp).toBe(9);
    expect(s.week[6].xp).toBe(5);
  });

  it("la meta diaria se acota en 1 y marca met", () => {
    const s = summarizeGamification([ev({ day: 100, xp: 80 })], 100);
    expect(s.dailyGoal).toEqual({ target: DAILY_XP_GOAL, earned: 80, progress: 1, met: true });
  });
});

describe("compareSummaries", () => {
  it("detecta subida de nivel, logros nuevos y meta recién cumplida", () => {
    const before = summarizeGamification([ev({ day: 100, xp: 40, kind: "review" })], 100);
    const after = summarizeGamification(
      [ev({ day: 100, xp: 40, kind: "review" }), ev({ day: 100, xp: 70, kind: "conversation" })],
      100,
    );
    const diff = compareSummaries(before, after);
    expect(diff.xpGained).toBe(70);
    expect(diff.leveledUp).toBe(true);
    expect(diff.goalJustMet).toBe(true);
    expect(diff.newAchievements.map((a) => a.id)).toContain("first-words");
  });

  it("sin cambios no celebra nada", () => {
    const s = summarizeGamification([ev({ day: 100, xp: 80 })], 100);
    expect(compareSummaries(s, s)).toEqual({
      xpGained: 0,
      leveledUp: false,
      goalJustMet: false,
      newAchievements: [],
    });
  });
});
