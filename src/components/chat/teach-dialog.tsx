"use client";

/**
 * Dialog "📚 Teach me": desglosa el turno de Emma en pronunciación (con audio por
 * fila), gramática y sugerencias de respuesta. Render estructurado (no Markdown
 * crudo) para un diseño limpio y para incrustar botones de audio.
 */

import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Lightbulb, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEmma } from "@/interface/emma-context";
import { SpeakButton } from "./speak-button";
import type {
  GrammarExample,
  GrammarForm,
  TeachingResult,
} from "@/domain/english-teacher/teaching-models";

interface Props {
  text: string | null;
  onClose: () => void;
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Etiqueta en español de cada forma: lo que se mueve al negar o preguntar (#168). */
const FORM_LABEL: Record<GrammarForm, string> = {
  affirmative: "Afirmación",
  negative: "Negación",
  question: "Pregunta",
};

/**
 * Resalta auxiliar y verbo principal con dos colores distintos. El match es por
 * palabra: el parser ya separó qué palabra es verbo y con qué papel, así que
 * aquí sólo se pinta. Ambos tokens tienen par en tema claro y oscuro.
 */
function MarkedSentence({ example }: { example: GrammarExample }) {
  const roleOf = new Map(example.verbs.map((v) => [v.text.toLowerCase(), v.role]));
  return (
    <p className="text-sm">
      {example.english.split(/(\s+)/).map((token, i) => {
        const role = roleOf.get(token.replace(/[.,;:!?¿¡]/g, "").toLowerCase());
        if (!role) return <span key={i}>{token}</span>;
        return (
          <span
            key={i}
            title={role === "auxiliary" ? "Verbo auxiliar" : "Verbo principal"}
            className={
              role === "auxiliary"
                ? "rounded bg-accent-soft px-1 font-medium text-accent"
                : "rounded bg-primary-soft px-1 font-semibold text-primary-deep"
            }
          >
            {token}
          </span>
        );
      })}
    </p>
  );
}

/** La misma idea en afirmación, negación y pregunta, una debajo de otra. */
export function GrammarForms({ examples }: { examples: GrammarExample[] }) {
  return (
    <div className="mt-2 space-y-1.5">
      {examples.map((e, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-0.5 w-[4.5rem] shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
            {FORM_LABEL[e.form]}
          </span>
          <MarkedSentence example={e} />
        </div>
      ))}
    </div>
  );
}

export function TeachDialog({ text, onClose }: Props) {
  const { runtime } = useEmma();
  const [result, setResult] = useState<TeachingResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text || !runtime) return;
    let alive = true;
    setResult(null);
    setLoading(true);
    runtime
      .teach({ text, responseId: `teach-${Date.now()}`, userId: 1, explainLanguage: "es" })
      .then((r) => alive && setResult(r))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [text, runtime]);

  const s = result?.sections;

  return (
    <Dialog open={!!text} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Enséñame
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          {loading && !s && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {s && (
            <div className="space-y-6">
              {s.phonetics.length > 0 && (
                <Section icon={<Volume2 className="h-4 w-4 text-primary" />} title="Pronunciación">
                  <div className="overflow-hidden rounded-lg border">
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-x-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                      <span className="w-7" />
                      <span>Inglés</span>
                      <span>Pronunciación</span>
                      <span>Traducción</span>
                    </div>
                    {s.phonetics.map((row, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-x-3 border-b px-3 py-2 text-sm last:border-0"
                      >
                        <SpeakButton text={row.word} />
                        <span className="font-medium">{row.word}</span>
                        <span className="italic text-muted-foreground">{row.sounds}</span>
                        <span>{row.translation}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {s.grammar.length > 0 && (
                <Section icon={<GraduationCap className="h-4 w-4 text-primary" />} title="Gramática">
                  <div className="space-y-2">
                    {s.grammar.map((g, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-semibold">{g.label}</span>
                          {g.tense && (
                            <Badge variant="secondary" className="shrink-0">
                              {g.tense}
                            </Badge>
                          )}
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{g.pattern}</code>
                        </div>
                        {g.examples ? (
                          <GrammarForms examples={g.examples} />
                        ) : (
                          g.example && <p className="mt-1 text-sm italic">{g.example}</p>
                        )}
                        <p className="mt-1 text-sm text-muted-foreground">{g.explanation}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {s.replies.length > 0 && (
                <Section icon={<Lightbulb className="h-4 w-4 text-primary" />} title="Sugerencias de respuesta">
                  <div className="space-y-2">
                    {s.replies.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border p-2.5">
                        <SpeakButton text={r.english} />
                        <span className="flex-1 text-sm font-medium">{r.english}</span>
                        {r.note && <Badge variant="secondary" className="shrink-0">{r.note}</Badge>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {result?.status === "error" && (
                <p className="text-sm text-muted-foreground">
                  No se pudo generar la explicación. Inténtalo de nuevo.
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
