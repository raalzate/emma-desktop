"use client";

/**
 * La escena, consultable en cualquier momento (#167). `SceneNarration` la narra
 * una sola vez al abrir el chat y después queda enterrada arriba del historial:
 * al scrollear, el aprendiz pierde de vista dónde está, con quién habla y cuál
 * es su misión. Este diálogo la devuelve sin tocar la conversación —no re-teclea
 * la narración, no dispara TTS, no cambia de turno.
 *
 * El contenido de la escena sigue en INGLÉS; el título del diálogo y el estado
 * de preparación van en español (Artículo 9).
 */

import { Clapperboard, Loader2, Target, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { buildSceneNarration, type NarrationKind } from "@/domain/chat/scene-narration";
import { personaFor } from "@/domain/personas/protopersona";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";

interface BodyProps {
  scenario: Scenario;
  situation?: SituationVariant | null;
  /** Falso mientras el LLM prepara la escena: se muestra el respaldo estático. */
  sceneReady: boolean;
  /** Narrativa del contrato de escena; null ⇒ respaldo estático. */
  narrative?: string | null;
}

const ICON_BY_KIND: Record<NarrationKind, typeof Clapperboard> = {
  setting: Clapperboard,
  character: User,
  mission: Target,
};

/**
 * Cuerpo del diálogo: puro y exportado aparte para fijarlo en una prueba de
 * render sin montar el portal de Radix.
 */
export function SceneDialogBody({ scenario, situation, sceneReady, narrative }: BodyProps) {
  const persona = personaFor(scenario.scenarioType, scenario.emmaRole);
  const beats = buildSceneNarration({
    scenarioTitle: scenario.title,
    scenarioDescription: scenario.description,
    situation,
    personaName: persona.name,
    personaRole: persona.role,
    narrative,
  });
  const mission = beats.filter((b) => b.kind === "mission");
  const rest = beats.filter((b) => b.kind !== "mission");

  return (
    <div className="space-y-3">
      {!sceneReady && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Creando tu escena…
        </p>
      )}
      {/* Franja de escena (FR-014): la misma banda ámbar que narró la entrada. */}
      <div className="space-y-2 rounded-[12px] bg-accent-soft px-4 py-3">
        <span className="block font-code text-[10px] font-medium tracking-[0.15em] text-accent">
          ESCENA
        </span>
        {rest.map((beat, i) => {
          const Icon = ICON_BY_KIND[beat.kind];
          return (
            <div key={i} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <p
                className={cn(
                  "text-sm italic leading-relaxed",
                  i === 0 ? "font-semibold tracking-tight text-foreground" : "text-foreground/75",
                )}
              >
                {beat.text}
              </p>
            </div>
          );
        })}
      </div>
      {mission.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tu objetivo en la escena (en inglés)
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {mission.map((beat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-scaffold-easy" aria-hidden />
                <span>{beat.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface Props extends BodyProps {
  open: boolean;
  onClose: () => void;
}

export function SceneDialog({ open, onClose, ...body }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tu escena</DialogTitle>
        </DialogHeader>
        <SceneDialogBody {...body} />
      </DialogContent>
    </Dialog>
  );
}
