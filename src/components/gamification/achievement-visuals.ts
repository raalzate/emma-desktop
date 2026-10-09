/** Icono y paleta (tokens del rediseño) de cada logro, por icono y por rango. */

import {
  BookCheck,
  Brain,
  CalendarCheck,
  Clapperboard,
  Crown,
  Dumbbell,
  Ear,
  Flame,
  MessageCircle,
  MessagesSquare,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AchievementIcon, AchievementTier } from "@/domain/gamification/achievements";

export const ACHIEVEMENT_ICONS: Record<AchievementIcon, LucideIcon> = {
  message: MessageCircle,
  messages: MessagesSquare,
  sparkles: Sparkles,
  flame: Flame,
  calendar: CalendarCheck,
  zap: Zap,
  clapperboard: Clapperboard,
  "trending-up": TrendingUp,
  dumbbell: Dumbbell,
  brain: Brain,
  ear: Ear,
  trophy: Trophy,
  "book-check": BookCheck,
  star: Star,
  crown: Crown,
};

export const TIER_STYLES: Record<AchievementTier, { medal: string; label: string }> = {
  bronze: { medal: "bg-scaffold-hard-bg text-scaffold-hard ring-scaffold-hard/40", label: "Bronze" },
  silver: { medal: "bg-primary-soft text-primary ring-primary/40", label: "Silver" },
  gold: { medal: "bg-accent-soft text-accent ring-accent/60", label: "Gold" },
};
