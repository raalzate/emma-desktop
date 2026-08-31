"use client";

/** Cabecera del chat: selector de escenario, badge de nivel y progreso de turnos. */

import Link from "next/link";
import { ArrowLeft, BarChart3, BookOpenCheck, ChevronDown, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}

export function ChatHeader({
  scenarios, scenario, onSelect, level, situationTitle, turnCount, maxTurns, sceneGoals,
}: Props) {
  const persona = personaFor(scenario.scenarioType, scenario.emmaRole);
  return (
    <header className="flex items-center gap-3 border-b bg-background px-4 py-3">
      <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
        <Link href="/" aria-label="Volver a tu ruta">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
        title={`${persona.name} · ${persona.role}`}
      >
        {persona.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="-ml-2 h-auto gap-1 truncate py-1 text-base font-semibold">
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
        <p className="truncate text-xs text-muted-foreground">
          Con <span className="font-medium text-foreground">{persona.name}</span> ({persona.role})
          {situationTitle ? ` — ${situationTitle}` : ""}
        </p>
      </div>
      {sceneGoals && (
        <span
          className="text-xs text-muted-foreground"
          title="Temas de la conversación que ya cubriste. Al completarlos, la escena se cierra."
        >
          Temas {sceneGoals.done}/{sceneGoals.total}
        </span>
      )}
      <span className="text-xs text-muted-foreground" title="Turnos usados de los disponibles en esta escena">
        {turnCount}/{maxTurns}
      </span>
      <Badge variant="secondary">{level}</Badge>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link href="/progress" aria-label="Mi progreso">
          <BarChart3 className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link href="/practice" aria-label="Práctica">
          <BookOpenCheck className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link href="/settings" aria-label="Configuración">
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
    </header>
  );
}
