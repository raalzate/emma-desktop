"use client";

import type { ReactNode } from "react";
import { EmmaProvider } from "./emma-context";
import { AiGate } from "./ai-gate";
import { SetupCheckGate } from "./setup-check-gate";
import { SetupIssueListener } from "@/components/setup/setup-issue-listener";
import { useMenuNavigation } from "@/hooks/use-menu-navigation";
import { Toaster } from "@/components/ui/toaster";
import { MotionProvider } from "@/components/motion";
import { CelebrationLayer } from "@/components/gamification/celebration-layer";

function MenuNav() {
  useMenuNavigation();
  return null;
}

/** Providers de cliente montados una vez en el layout raíz. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <EmmaProvider>
        <MenuNav />
        <AiGate>
          <SetupCheckGate>{children}</SetupCheckGate>
        </AiGate>
        <SetupIssueListener />
        <Toaster />
        <CelebrationLayer />
      </EmmaProvider>
    </MotionProvider>
  );
}
