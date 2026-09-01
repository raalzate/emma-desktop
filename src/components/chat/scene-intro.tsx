"use client";

/**
 * Antesala de la simulación: explica la escena ANTES de entrar al chat, para
 * que el salto post-onboarding (o al cambiar de escenario) no sea brusco. El
 * kickoff de Emma solo ocurre cuando el usuario pulsa comenzar.
 */

import { CheckCircle2, Clapperboard, Loader2, Play, Sparkles, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import { personaFor } from "@/domain/personas/protopersona";
import { buildSceneBriefing } from "@/domain/situations/scene-briefing";
import { characterLabel } from "@/domain/situations/character-label";
import type { SituationVariant } from "@/domain/situations/situation-variant";

interface Props {
  scenario: Scenario;
  situation?: SituationVariant | null;
  level: CefrLevel;
  maxTurns: number;
  starting: boolean;
  /** Narrativa del contrato de escena (null mientras se genera o si falló). */
  narrative: string | null;
  /** El contrato de escena está listo: habilita el botón de comenzar. */
  sceneReady: boolean;
  onStart: () => void;
}

/** Escena en inglés (contrato con fallback estático) + misión en inglés. */
function SituationBriefing({
  situation,
  narrative,
  sceneReady,
}: {
  situation: SituationVariant;
  narrative: string | null;
  sceneReady: boolean;
}) {
  const briefing = buildSceneBriefing(situation);
  return (
    <div className="flex items-start gap-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Imagina la escena
          </p>
          <Badge variant="outline" className="text-[10px]">
            {characterLabel(situation.character)}
          </Badge>
        </div>
        <p className="text-sm font-medium">{situation.title}</p>
        {!sceneReady ? (
          <p className="mt-1 flex items-center gap-2 text-sm leading-relaxed text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Creando tu escena…
          </p>
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {narrative ?? briefing.hypothetical}
          </p>
        )}
        {briefing.missionLines.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tu objetivo en la escena (en inglés)
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {briefing.missionLines.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function SceneIntro({ scenario, situation, level, maxTurns, starting, narrative, sceneReady, onStart }: Props) {
  const persona = personaFor(scenario.scenarioType, scenario.emmaRole);
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-lg space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Clapperboard className="h-6 w-6 text-primary" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tu próxima escena
          </p>
          <h2 className="text-2xl font-semibold">{scenario.title}</h2>
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hablarás con
              </p>
              <p className="text-sm font-medium">
                {persona.name} · {persona.role}
              </p>
              <p className="text-xs text-muted-foreground">{persona.trait}</p>
            </div>
          </div>
          {situation && (
            <SituationBriefing situation={situation} narrative={narrative} sceneReady={sceneReady} />
          )}
          <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
            <Badge variant="secondary">{level}</Badge>
            <span>Conversación en inglés · hasta {maxTurns} turnos · sin correcciones en vivo</span>
          </div>
        </div>

        <div className="space-y-2 text-center">
          <Button size="lg" className="gap-2 px-8" onClick={onStart} disabled={starting || !sceneReady}>
            {!sceneReady ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {!sceneReady
              ? "Creando tu escena…"
              : starting
                ? "Preparando la escena…"
                : "Estoy listo, comenzar"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Habla con naturalidad: los errores se revisan al final, no durante la charla.
          </p>
        </div>
      </div>
    </div>
  );
}
