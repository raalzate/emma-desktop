"use client";

/**
 * Escucha los fallos en vivo (voz que cae a Web Speech, IA que no responde) y
 * sugiere el chequeo con un toast, como mucho una vez cada 10 minutos. No
 * interrumpe el turno: sólo informa.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { onLiveFailure } from "@/interface/live-failure-bus";
import { createIssueHandler, settingsUrlFor } from "./setup-issue-handler";

export function SetupIssueListener() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handle = createIssueHandler({
      now: () => Date.now(),
      suggest: (cause) =>
        toast({
          title: "Something isn't working well",
          description: "Run a quick check of voice, AI and microphone.",
          action: (
            <ToastAction
              altText="Run setup check"
              title="Abre Ajustes y repite la prueba que falló."
              onClick={() => router.push(settingsUrlFor(cause))}
            >
              Run setup check
            </ToastAction>
          ),
        }),
    });
    return onLiveFailure(handle);
  }, [router, toast]);

  return null;
}
