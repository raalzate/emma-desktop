"use client";

/**
 * Presentación de escena al inicio de la conversación (FR-014/015 de la spec
 * 002): qué escenario es, qué situación se juega y con quién habla el aprendiz.
 * Sin esto el usuario no distingue la escena y se rompe la inmersión.
 */

import { CheckCircle2, Clapperboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Scenario } from "@/domain/scenarios/scenario";
import { personaFor } from "@/domain/personas/protopersona";
import { buildSceneBriefing } from "@/domain/situations/scene-briefing";
import { characterLabel } from "@/domain/situations/character-label";
import type { SituationVariant } from "@/domain/situations/situation-variant";

interface Props {
  scenario: Scenario;
  situation?: SituationVariant | null;
}

/** Versión compacta del briefing: ambientación y objetivos, ambos en inglés. */
function BannerBriefing({ situation }: { situation: SituationVariant }) {
  const briefing = buildSceneBriefing(situation);
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-medium">{situation.title}</span>
        <Badge variant="outline" className="text-[10px]">
          {characterLabel(situation.character)}
        </Badge>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{briefing.hypothetical}</p>
      {briefing.missionLines.length > 0 && (
        <ul className="space-y-1 text-left">
          {briefing.missionLines.map((line, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SceneContext({ scenario, situation }: Props) {
  const persona = personaFor(scenario.scenarioType, scenario.emmaRole);
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Clapperboard className="h-3.5 w-3.5" />
        Escenario
      </div>
      <p className="mt-1 text-sm font-semibold">{scenario.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Hablas con:{" "}
        <span className="font-medium text-foreground">
          {persona.name} · {persona.role}
        </span>
      </p>
      {situation && <BannerBriefing situation={situation} />}
    </div>
  );
}
