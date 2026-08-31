"use client";

import type { ReactNode } from "react";
import { EmmaProvider } from "./emma-context";
import { AiGate } from "./ai-gate";
import { useMenuNavigation } from "@/hooks/use-menu-navigation";
import { Toaster } from "@/components/ui/toaster";

function MenuNav() {
  useMenuNavigation();
  return null;
}

/** Providers de cliente montados una vez en el layout raíz. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <EmmaProvider>
      <MenuNav />
      <AiGate>{children}</AiGate>
      <Toaster />
    </EmmaProvider>
  );
}
