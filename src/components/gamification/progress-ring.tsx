"use client";

/** Anillo de progreso SVG que se llena al montar (nivel de jugador, meta diaria). */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useRevealedValue } from "./motion-utils";

interface Props {
  /** 0–1. */
  value: number;
  size?: number;
  stroke?: number;
  barClassName?: string;
  trackClassName?: string;
  className?: string;
  title?: string;
  children?: ReactNode;
}

export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  barClassName = "stroke-primary",
  trackClassName = "stroke-muted",
  className,
  title,
  children,
}: Props) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const shown = useRevealedValue(clamped);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      title={title}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={trackClassName} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown)}
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none", barClassName)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
