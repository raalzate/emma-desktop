/** Selector del modo de repaso (FR-010): Text, Audio o Mixed, cada uno con su conteo. */
import { Button } from "@/components/ui/button";
import type { ModeCounts, ReviewMode } from "@/domain/srs/review-mode";

export type { ModeCounts };

const OPTIONS: { mode: ReviewMode; label: string; tip: string }[] = [
  { mode: "text", label: "Text", tip: "Repasa solo tarjetas de texto" },
  { mode: "audio", label: "Audio", tip: "Repasa solo dictados con audio" },
  { mode: "mixed", label: "Mixed", tip: "Mezcla tarjetas de texto y de audio" },
];

interface Props {
  mode: ReviewMode;
  counts: ModeCounts;
  onChange: (mode: ReviewMode) => void;
}

export function ReviewModeSelector({ mode, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Review mode">
      {OPTIONS.map((o) => (
        <Button
          key={o.mode}
          size="sm"
          variant={mode === o.mode ? "secondary" : "outline"}
          aria-pressed={mode === o.mode}
          title={o.tip}
          onClick={() => onChange(o.mode)}
        >
          {o.label} ({counts[o.mode]})
        </Button>
      ))}
    </div>
  );
}
