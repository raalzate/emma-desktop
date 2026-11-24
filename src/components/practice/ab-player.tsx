/** Comparación A/B: la referencia y tu intento, cada uno con su propio botón. */
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  attemptUrl: string | null;
  onPlayReference: () => void;
  onPlayAttempt: () => void;
}

export function AbPlayer({ attemptUrl, onPlayReference, onPlayAttempt }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Compare reference and your attempt">
      <Button
        variant="outline"
        className="gap-1"
        title="Reproduce la referencia"
        aria-label="Play reference"
        onClick={onPlayReference}
      >
        <Play className="h-4 w-4" /> Play reference
      </Button>
      {attemptUrl && (
        <Button
          variant="outline"
          className="gap-1"
          title="Reproduce tu intento grabado"
          aria-label="Play you"
          onClick={onPlayAttempt}
        >
          <Play className="h-4 w-4" /> Play you
        </Button>
      )}
    </div>
  );
}
