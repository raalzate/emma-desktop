"use client";

/**
 * Burbuja de chat del onboarding y avatar de Emma. Emma se alinea a la
 * izquierda; el usuario a la derecha. Sin lógica de flujo: sólo presentación.
 */

import { cn } from "@/lib/utils";

export type BubbleRole = "emma" | "user";

/** Avatar circular con la inicial de Emma; `lg` para la cabecera. */
export function EmmaAvatar({ size = "sm" }: { size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-11 w-11 text-lg" : "h-8 w-8 text-sm";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        cls,
      )}
    >
      E
    </div>
  );
}

/** Una burbuja de la transcripción. */
export function OnboardingBubble({ role, text }: { role: BubbleRole; text: string }) {
  const isEmma = role === "emma";
  return (
    <div
      className={cn(
        "flex w-full gap-2 duration-300 animate-in fade-in slide-in-from-bottom-1",
        isEmma ? "justify-start" : "justify-end",
      )}
    >
      {isEmma && <EmmaAvatar />}
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
          isEmma
            ? "rounded-tl-sm bg-muted text-foreground"
            : "rounded-tr-sm bg-primary text-primary-foreground",
        )}
      >
        {text}
      </div>
    </div>
  );
}
