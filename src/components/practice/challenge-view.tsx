"use client";

/**
 * Tab "Retos": los 72 retos del libro (paso 7, output forzado). Selector de
 * unidad → lista de retos con estado → detalle con instrucciones, criterios
 * (rúbrica) y entrega en texto. Los de `mode: "oral"` se practican en voz
 * alta; el textarea igual permite guardar notas de la práctica.
 */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { challengesForUnit } from "@/domain/curriculum/challenge-selection";
import type { UnitChallenge } from "@/domain/curriculum/unit";
import { ALL_UNITS } from "@/lib/curriculum-data";
import {
  getChallengeProgress,
  submitChallenge,
} from "@/application/challenges/complete-challenge-use-case";
import { createChallengeRepository } from "@/infrastructure/persistence/challenge-repository";

const AVAILABLE_UNITS = ALL_UNITS.map((u) => u.number).sort((a, b) => a - b);

function unitLabel(unitNumber: number): string {
  const unit = ALL_UNITS.find((u) => u.number === unitNumber);
  return unit ? `Unidad ${unitNumber} · ${unit.title}` : `Unidad ${unitNumber}`;
}

interface ChallengeDetailProps {
  challenge: UnitChallenge;
  completed: boolean;
  onSubmitted: () => void;
  onExit: () => void;
}

function ChallengeDetail({ challenge, completed, onSubmitted, onExit }: ChallengeDetailProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const repo = useMemo(() => createChallengeRepository(), []);

  async function handleSubmit() {
    setSaving(true);
    try {
      await submitChallenge({ repo, challengeId: challenge.id, text });
      onSubmitted();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Reto {challenge.id} {completed && "· ✅ completado"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{challenge.instructionsEs}</p>
        {challenge.mode === "oral" && (
          <p className="text-xs text-muted-foreground">
            Este reto se practica en voz alta. Puedes igual escribir notas de tu práctica abajo.
          </p>
        )}
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {challenge.criteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu entrega o tus notas de práctica…"
          rows={6}
        />
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={saving || text.trim().length === 0}>
            Marcar como completado
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Volver a la lista
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  initialUnit?: number;
}

export function ChallengeView({ initialUnit }: Props = {}) {
  const [unit, setUnit] = useState<number>(
    initialUnit !== undefined && AVAILABLE_UNITS.includes(initialUnit)
      ? initialUnit
      : AVAILABLE_UNITS[0] ?? 1,
  );
  const [selected, setSelected] = useState<UnitChallenge | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 72 });
  const repo = useMemo(() => createChallengeRepository(), []);

  const refresh = useMemo(
    () => async () => {
      const [ids, prog] = await Promise.all([
        repo.loadCompleted(),
        getChallengeProgress({ repo }),
      ]);
      setCompleted(new Set(ids));
      setProgress(prog);
    },
    [repo],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const challenges = useMemo(() => challengesForUnit(unit), [unit]);

  if (selected) {
    return (
      <ChallengeDetail
        challenge={selected}
        completed={completed.has(selected.id)}
        onSubmitted={() => {
          void refresh();
          setSelected(null);
        }}
        onExit={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Progreso: {progress.done}/{progress.total} retos completados
        </p>
        <Progress value={(progress.done / progress.total) * 100} />
      </div>

      <Select value={String(unit)} onValueChange={(v) => setUnit(Number(v))}>
        <SelectTrigger className="w-full sm:w-80">
          <SelectValue placeholder="Elige una unidad" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_UNITS.map((u) => (
            <SelectItem key={u} value={String(u)}>
              {unitLabel(u)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid gap-2 sm:grid-cols-2">
        {challenges.map((challenge) => (
          <Card
            key={challenge.id}
            className="cursor-pointer transition hover:border-primary"
            onClick={() => setSelected(challenge)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm">
                Reto {challenge.id} {completed.has(challenge.id) ? "· ✅" : "· pendiente"}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
        {challenges.length === 0 && (
          <p className="text-sm text-muted-foreground">Esta unidad no tiene retos.</p>
        )}
      </div>
    </div>
  );
}
