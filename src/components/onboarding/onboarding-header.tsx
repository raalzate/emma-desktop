"use client";

/**
 * Cabecera del onboarding: identidad visual cálida de Emma. Sin estado.
 */

import { EmmaAvatar } from "@/components/onboarding/onboarding-bubble";

export function OnboardingHeader() {
  return (
    <header className="flex items-center gap-3">
      <EmmaAvatar size="lg" />
      <div>
        <h1 className="text-lg font-semibold leading-tight">Hi, I'm Emma</h1>
        <p className="text-sm text-muted-foreground">
          Let's chat for a moment so I can get to know you and tailor your practice.
        </p>
      </div>
    </header>
  );
}
