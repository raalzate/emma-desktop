"use client";

/** Cifra que cuenta hacia su valor (XP total, XP ganado). */

import { useCountUp } from "./motion-utils";

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const shown = useCountUp(value);
  return <span className={className}>{shown.toLocaleString("en")}</span>;
}
