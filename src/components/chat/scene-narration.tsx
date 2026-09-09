"use client";

/**
 * La escena, NARRADA. Sustituye a la ficha estática que abría el chat: en vez
 * de una tarjeta con datos, la escena se teclea compás a compás —dónde estás,
 * con quién hablás, qué tenés que lograr— y desemboca en la primera línea del
 * personaje. El aprendiz entra caminando a la ficción, como en un videojuego.
 *
 * Contenido en INGLÉS (es la escena); el andamiaje —el aviso de saltar— en
 * español (Artículo 9).
 */

import { useEffect, useMemo } from "react";
import { Clapperboard, Target, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildSceneNarration, type NarrationKind } from "@/domain/chat/scene-narration";
import { personaFor } from "@/domain/personas/protopersona";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import { useTypewriter } from "./use-typewriter";

interface Props {
  scenario: Scenario;
  situation?: SituationVariant | null;
  /**
   * Teclear la narración. Falso al reabrir una conversación del histórico: ya
   * se vivió esa escena y volver a teclearla haría esperar por nada.
   */
  animate?: boolean;
  /**
   * La narración terminó. La conversación se revela recién entonces: mientras
   * la escena se teclea, la persona no habla ni aparece "escribiendo…" debajo.
   */
  onDone?: () => void;
}

const ICON_BY_KIND: Record<NarrationKind, typeof Clapperboard> = {
  setting: Clapperboard,
  character: User,
  mission: Target,
};

/** Cursor de tecleo: sólo en el compás que se está escribiendo. */
function Caret() {
  return <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-foreground/60">&nbsp;</span>;
}

export function SceneNarration({ scenario, situation, animate = true, onDone }: Props) {
  const persona = personaFor(scenario.scenarioType, scenario.emmaRole);
  const beats = useMemo(
    () =>
      buildSceneNarration({
        scenarioTitle: scenario.title,
        scenarioDescription: scenario.description,
        situation,
        personaName: persona.name,
        personaRole: persona.role,
      }),
    [scenario.title, scenario.description, situation, persona.name, persona.role],
  );
  const texts = useMemo(() => beats.map((b) => b.text), [beats]);
  const { visible, done, skip } = useTypewriter(texts, { animate });

  // Al reabrir del histórico el hook nace ya `done`: el aviso tiene que salir
  // igual, o la conversación guardada se quedaría escondida para siempre.
  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  // Franja de escena (FR-014): la narración vive en una banda ámbar suave con
  // tag mono «ESCENA»; el texto de la ficción va en itálica y sigue en inglés.
  return (
    <div className="mx-auto w-full max-w-xl py-2">
      <div className="space-y-2 rounded-[12px] bg-accent-soft px-4 py-3">
        <span className="block font-code text-[10px] font-medium tracking-[0.15em] text-accent-foreground">
          ESCENA
        </span>
        {visible.map((text, i) => {
        const beat = beats[i];
        const Icon = ICON_BY_KIND[beat.kind];
        const typing = !done && i === visible.length - 1;
        return (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2.5 duration-300 animate-in fade-in slide-in-from-bottom-1",
              beat.kind === "mission" && "pl-4",
            )}
          >
              <Icon
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  beat.kind === "mission" ? "text-scaffold-easy" : "text-muted-foreground",
                )}
              />
              <p
                className={cn(
                  "text-sm italic leading-relaxed",
                  beat.kind === "setting" && i === 0
                    ? "font-semibold tracking-tight text-foreground"
                    : "text-foreground/75",
                )}
              >
                {text}
                {typing && <Caret />}
              </p>
            </div>
          );
        })}
        {!done && (
          <button
            type="button"
            onClick={skip}
            className="ml-6 text-xs text-muted-foreground/70 underline-offset-2 hover:underline"
          >
            Saltar la introducción
          </button>
        )}
      </div>
    </div>
  );
}
