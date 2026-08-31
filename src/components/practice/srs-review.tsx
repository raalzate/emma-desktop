"use client";

/**
 * Repaso espaciado (SRS): carga las tarjetas vencidas de hoy con
 * startReviewSession y aplica answerCard al calificar. `today` = días desde
 * epoch, igual que el resto del dominio Leitner (sin Date oculto).
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { SrsCard } from "@/domain/srs/srs-card";
import { startReviewSession, answerCard } from "@/application/srs/review-session-use-case";

const MS_PER_DAY = 86_400_000;

function todayAsDays(): number {
  return Math.floor(Date.now() / MS_PER_DAY);
}

export function SrsReview({ runtime }: { runtime: EmmaRuntime }) {
  const [cards, setCards] = useState<SrsCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const due = await startReviewSession({ repo: runtime.repos.srs, today: todayAsDays() });
      if (!alive) return;
      setCards(due);
    })();
    return () => {
      alive = false;
    };
  }, [runtime]);

  if (cards === null) {
    return <p className="text-sm text-muted-foreground">Cargando tarjetas…</p>;
  }

  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay tarjetas pendientes. Las tarjetas se crean con tus errores de conversación.
      </p>
    );
  }

  if (index >= cards.length) {
    return (
      <p className="text-sm">
        Repaso terminado: {reviewed} de {cards.length} tarjetas.
      </p>
    );
  }

  const current = cards[index];

  async function grade(correct: boolean) {
    await answerCard({ repo: runtime.repos.srs, cardId: current.id, correct, today: todayAsDays() });
    setReviewed((n) => n + 1);
    setShowBack(false);
    setIndex((i) => i + 1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Tarjeta {index + 1} de {cards.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{current.front}</p>
        {showBack ? (
          <>
            <p className="text-primary">{current.back}</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => grade(false)}>
                Fallé
              </Button>
              <Button onClick={() => grade(true)}>La supe</Button>
            </div>
          </>
        ) : (
          <Button onClick={() => setShowBack(true)}>Mostrar respuesta</Button>
        )}
      </CardContent>
    </Card>
  );
}
