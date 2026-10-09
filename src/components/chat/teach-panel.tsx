"use client";

/**
 * Panel "📚 Teach me": desglosa el turno de Emma en pronunciación (con audio por
 * fila), gramática y sugerencias de respuesta. Vive en una columna al lado del
 * chat, no en un modal: se lee sin perder de vista la conversación.
 */

import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Lightbulb, Volume2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEmma } from "@/interface/emma-context";
import { SpeakButton } from "./speak-button";
import { KaraokeLine } from "./karaoke-line";
import { SidePanel } from "./side-panel";
import type {
  GrammarExample,
  GrammarForm,
  ReplySuggestion,
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

/** Etiqueta de cada forma: lo que se mueve al negar o preguntar (#168). */
const FORM_LABEL: Record<GrammarForm, string> = {
  affirmative: "Affirmative",
  negative: "Negative",
  question: "Question",
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
        const role = roleOf.get(token.replace(/[.,;:!?\u00bf\u00a1]/g, "").toLowerCase());
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

/** Cada sugerencia de respuesta en karaoke, con su nota (p.ej. «Casual») al final de la fila. */
export function ReplySuggestions({ replies }: { replies: ReplySuggestion[] }) {
  return (
    <div className="space-y-2">
      {replies.map((r, i) => (
        <KaraokeLine
          key={i}
          text={r.english}
          className="rounded-lg border p-2.5"
          trailing={r.note && <Badge variant="secondary" className="shrink-0">{r.note}</Badge>}
        />
      ))}
    </div>
  );
}

export function TeachPanel({ text, onClose }: Props) {
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

  if (!text) return null;

  return (
    <SidePanel
      title={
        <>
          <BookOpen className="h-5 w-5 text-primary" /> Teach me
        </>
      }
      onClose={onClose}
    >
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
            <Section icon={<Volume2 className="h-4 w-4 text-primary" />} title="Pronunciation">
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-x-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span className="w-7" />
                  <span>English</span>
                  <span>Pronunciation</span>
                  <span>Translation</span>
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
            <Section icon={<GraduationCap className="h-4 w-4 text-primary" />} title="Grammar">
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
            <Section icon={<Lightbulb className="h-4 w-4 text-primary" />} title="Reply suggestions">
              <ReplySuggestions replies={s.replies} />
            </Section>
          )}

          {result?.status === "error" && (
            <p className="text-sm text-muted-foreground">
              The explanation couldn’t be generated. Please try again.
            </p>
          )}
        </div>
      )}
    </SidePanel>
  );
}
