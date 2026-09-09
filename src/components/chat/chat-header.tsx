"use client";

/**
 * Cabecera del chat (rediseño «Café sereno», FR-013): título de escena en
 * display, badge CEFR mono sobre azul suave, contador de turnos con puntos y
 * pill de objetivos con borde. La navegación general vive en el AppShell; aquí
 * solo quedan el regreso a la ruta y la salida discreta de la escena.
 */

import Link from "next/link";
import { ArrowLeft, ChevronDown, Flag, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import { personaFor } from "@/domain/personas/protopersona";

interface Props {
  scenarios: Scenario[];
  scenario: Scenario;
  onSelect: (s: Scenario) => void;
  level: CefrLevel;
  situationTitle?: string;
  turnCount: number;
  maxTurns: number;
  /** Objetivos de la escena cubiertos/total; null si el escenario es de flujo libre. */
  sceneGoals?: { done: number; total: number } | null;
  /**
   * Salida para cortar la escena antes de tiempo. Discreta a propósito: el
   * cierre normal vive al final de la conversación, no arriba compitiendo con
   * el hilo. Sin handler el icono no se pinta (escena ya cerrada o en antesala).
   */
  onFinishEarly?: () => void;
  finishEarlyDisabled?: boolean;
}

/** Contador de turnos del mockup: texto + hilera de puntos llenos/vacíos. */
function TurnDots({ turnCount, maxTurns }: { turnCount: number; maxTurns: number }) {
  return (
    <div
      className="flex items-center gap-2"
      title="Turnos usados de los disponibles en esta escena"
    >
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        Turno {turnCount} de {maxTurns}
      </span>
      <div className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: maxTurns }).map((_, i) => (
          <span
            key={i}
            className={cn("h-1.5 w-1.5 rounded-full", i < turnCount ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatHeader({
  scenarios, scenario, onSelect, level, situationTitle, turnCount, maxTurns, sceneGoals,
  onFinishEarly, finishEarlyDisabled,
}: Props) {
  const persona = personaFor(scenario.scenarioType, scenario.emmaRole);
  return (
    <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
      <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
        <Link href="/" aria-label="Volver a tu ruta">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-auto gap-1 truncate py-1 font-headline text-lg font-semibold tracking-tight"
              >
                {scenario.title}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              {scenarios.map((s) => (
                <DropdownMenuItem key={s.scenarioType} onSelect={() => onSelect(s)}>
                  {s.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-code text-xs font-medium text-primary-deep">
            {level}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          Con <span className="font-medium text-foreground">{persona.name}</span> ({persona.role})
          {situationTitle ? ` — ${situationTitle}` : ""}
        </p>
      </div>
      <TurnDots turnCount={turnCount} maxTurns={maxTurns} />
      {sceneGoals && (
        <span
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-foreground"
          title="Temas de la conversación que ya cubriste. Al completarlos, la escena se cierra."
        >
          <Target className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          Objetivos {sceneGoals.done}/{sceneGoals.total}
        </span>
      )}
      {onFinishEarly && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onFinishEarly}
          disabled={finishEarlyDisabled}
          aria-label="Terminar la escena antes"
          title="Terminar antes y ver tu lección"
        >
          <Flag className="h-4 w-4" />
        </Button>
      )}
    </header>
  );
}
