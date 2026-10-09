"use client";

/**
 * Capa de celebración global (#216, H1–H4): escucha cada premio de XP y lo
 * hace visible — «+N XP» que sube y se desvanece, la meta del día cumplida,
 * un toast por logro desbloqueado y, al subir de nivel de jugador, una tarjeta
 * con confeti. Montada una vez en los providers: cualquier práctica, en
 * cualquier pantalla, celebra igual.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PartyPopper, Sparkles, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { XpAward } from "@/application/gamification/award-xp-use-case";
import type { Achievement } from "@/domain/gamification/achievements";
import type { PlayerLevel } from "@/domain/gamification/player-level";
import { XP_AWARDED } from "./award-activity";
import { AchievementMedal } from "./achievement-medal";
import { Confetti } from "./confetti";
import { ProgressRing } from "./progress-ring";
import { TIER_STYLES } from "./achievement-visuals";

const FLOAT_MS = 2600;
const TOAST_MS = 5500;

export interface XpFloat {
  id: number;
  xp: number;
  goalMet: boolean;
}

export interface AchievementToast {
  id: number;
  achievement: Achievement;
}

interface ViewProps {
  floats: XpFloat[];
  toasts: AchievementToast[];
  levelUp: PlayerLevel | null;
  onCloseToast: (id: number) => void;
  onCloseLevelUp: () => void;
}

function FloatStack({ floats }: { floats: XpFloat[] }) {
  return (
    <div className="pointer-events-none fixed right-6 top-6 z-[80] flex flex-col items-end gap-2" aria-live="polite">
      {floats.map((f) => (
        <div key={f.id} className="flex flex-col items-end gap-2 motion-safe:animate-xp-float">
          <span className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-headline text-lg font-bold text-primary-foreground shadow-lg">
            <Sparkles className="h-4 w-4" aria-hidden />+{f.xp} XP
          </span>
          {f.goalMet && (
            <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground shadow-lg">
              <Target className="h-4 w-4" aria-hidden />
              Daily goal reached!
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ToastStack({ toasts, onClose }: { toasts: AchievementToast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex w-80 flex-col gap-3" aria-live="polite">
      {toasts.map(({ id, achievement }) => (
        <div
          key={id}
          role="status"
          className="flex items-center gap-3 rounded-bubble border border-border bg-card p-3 shadow-xl motion-safe:animate-slide-in-right"
        >
          <AchievementMedal achievement={achievement} unlocked size={48} className="motion-safe:animate-pop-in" />
          <div className="min-w-0 flex-1">
            <p className="font-code text-[10px] uppercase tracking-widest text-muted-foreground">
              Achievement unlocked · {TIER_STYLES[achievement.tier].label}
            </p>
            <p className="font-headline font-semibold">{achievement.title}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
          </div>
          <button
            type="button"
            title="Cerrar el aviso del logro"
            onClick={() => onClose(id)}
            className="self-start rounded-md p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

function LevelUpCard({ level, onClose }: { level: PlayerLevel; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Level up"
      onClick={onClose}
    >
      <Confetti />
      <div
        className="relative flex w-80 flex-col items-center gap-4 rounded-bubble border border-border bg-card p-8 text-center shadow-2xl motion-safe:animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <PartyPopper className="h-8 w-8 text-accent" aria-hidden />
        <p className="font-code text-[11px] uppercase tracking-widest text-muted-foreground">Level up!</p>
        <ProgressRing value={1} size={128} stroke={10} barClassName="stroke-accent">
          <span className="font-headline text-5xl font-bold leading-none">{level.level}</span>
        </ProgressRing>
        <p className="font-headline text-2xl font-semibold">{level.title}</p>
        <p className="text-sm text-muted-foreground">
          {level.xpForLevel} XP to the next level. Keep practicing every day.
        </p>
        <Button title="Cerrar la celebración y seguir practicando" onClick={onClose} autoFocus>
          Keep going
        </Button>
      </div>
    </div>
  );
}

export function CelebrationLayerView({ floats, toasts, levelUp, onCloseToast, onCloseLevelUp }: ViewProps) {
  return (
    <>
      <FloatStack floats={floats} />
      <ToastStack toasts={toasts} onClose={onCloseToast} />
      {levelUp && <LevelUpCard level={levelUp} onClose={onCloseLevelUp} />}
    </>
  );
}

export function CelebrationLayer() {
  const [floats, setFloats] = useState<XpFloat[]>([]);
  const [toasts, setToasts] = useState<AchievementToast[]>([]);
  const [levelUp, setLevelUp] = useState<PlayerLevel | null>(null);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((ms: number, run: () => void) => {
    timers.current.push(setTimeout(run, ms));
  }, []);

  const closeToast = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  useEffect(() => {
    const onAward = (e: Event) => {
      const award = (e as CustomEvent<XpAward>).detail;
      if (!award || award.xp <= 0) return;
      const floatId = (nextId.current += 1);
      setFloats((list) => [...list, { id: floatId, xp: award.xp, goalMet: award.goalJustMet }]);
      later(FLOAT_MS, () => setFloats((list) => list.filter((f) => f.id !== floatId)));
      for (const achievement of award.newAchievements) {
        const toastId = (nextId.current += 1);
        setToasts((list) => [...list, { id: toastId, achievement }]);
        later(TOAST_MS, () => closeToast(toastId));
      }
      if (award.leveledUp) setLevelUp(award.after.level);
    };
    window.addEventListener(XP_AWARDED, onAward);
    const pending = timers.current;
    return () => {
      window.removeEventListener(XP_AWARDED, onAward);
      pending.forEach(clearTimeout);
    };
  }, [later, closeToast]);

  useEffect(() => {
    if (!levelUp) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLevelUp(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [levelUp]);

  return (
    <CelebrationLayerView
      floats={floats}
      toasts={toasts}
      levelUp={levelUp}
      onCloseToast={closeToast}
      onCloseLevelUp={() => setLevelUp(null)}
    />
  );
}
