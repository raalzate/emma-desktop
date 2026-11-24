"use client";

/**
 * Aviso de una sola vez sobre dónde viven las grabaciones (FR-023). La vista es
 * presentacional; el componente la une al gate que decide cuándo aparece.
 */

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUDIO_NOTICE } from "@/domain/audio/audio-privacy-notice";
import type { AudioNoticeGate } from "./audio-notice-gate";

export function AudioPrivacyNoticeView({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="status" className="flex items-start gap-3 border-b bg-accent-soft px-4 py-2 text-sm">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{AUDIO_NOTICE.title}</p>
        <p className="text-xs text-muted-foreground">{AUDIO_NOTICE.body}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        title="Cierra el aviso; no volverá a aparecer"
        onClick={onDismiss}
      >
        Got it
      </Button>
    </div>
  );
}

export function AudioPrivacyNotice({ gate }: { gate: AudioNoticeGate }) {
  const [visible, setVisible] = useState(gate.visible());
  useEffect(() => gate.subscribe(setVisible), [gate]);
  return visible ? <AudioPrivacyNoticeView onDismiss={() => void gate.dismiss()} /> : null;
}
