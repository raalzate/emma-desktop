"use client";

/**
 * Plan de estudio personal: dónde está el aprendiz en las 24 semanas, qué
 * toca esta semana en la app y cómo va cada semana (hecha, actual, por
 * venir) con su avance real de retos. Lo decide el dominio
 * (`buildPersonalStudyPlan`); acá sólo se pinta, en lenguaje de producto.
 * Debajo, la rutina diaria de 45 minutos y las reglas del método.
 */

import { Check, Circle, MapPin } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DAILY_DISTRIBUTION } from "@/domain/curriculum/study-plan";
import { buildPersonalStudyPlan, type PlanWeekView } from "@/domain/curriculum/personal-study-plan";
import { SEVEN_STEP_CYCLE } from "@/domain/curriculum/seven-step-cycle";
import { METHOD_RULES } from "@/domain/curriculum/method-rules";

const DAILY_LABELS: Record<keyof typeof DAILY_DISTRIBUTION, string> = {
  repaso: "Review",
  input: "Input",
  notice: "Notice",
  practice: "Practice",
  output: "Output",
};

const DAILY_HELP: Record<keyof typeof DAILY_DISTRIBUTION, string> = {
  repaso: "Due cards (Review tab)",
  input: "Read or listen to the unit lesson",
  notice: "Notice the structure before using it",
  practice: "Closed exercises (Exercises tab)",
  output: "Produce: a challenge or a conversation with Emma",
};

const STATUS_LABEL_ES: Record<PlanWeekView["status"], string> = {
  done: "done",
  current: "this week",
  upcoming: "upcoming",
};

interface Props {
  /** Unidad activa del aprendiz; null si todavía está en los sonidos. */
  activeUnit: number | null;
  completedChallengeIds: readonly number[];
}

function WeekRow({ week }: { week: PlanWeekView }) {
  const isCurrent = week.status === "current";
  const rowTone =
    week.status === "done" ? "text-muted-foreground" : isCurrent ? "bg-primary-soft font-medium" : "";
  return (
    <tr aria-current={isCurrent ? "step" : undefined} className={`border-t ${rowTone}`}>
      <td className="p-2 font-medium">
        <span className="flex items-center gap-1">
          {week.status === "done" ? (
            <Check className="h-3.5 w-3.5 text-scaffold-easy" />
          ) : (
            <Circle className={`h-3 w-3 ${isCurrent ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          )}
          {week.week}
        </span>
      </td>
      <td className="p-2">{week.focusEs}</td>
      <td className="p-2 font-code text-xs">
        {week.challenges.total === 0 ? "—" : `${week.challenges.done}/${week.challenges.total}`}
      </td>
      <td className="p-2">{week.milestone}</td>
      <td className="p-2 font-code text-[11px] uppercase">{STATUS_LABEL_ES[week.status]}</td>
    </tr>
  );
}

export function StudyPlanView({ activeUnit, completedChallengeIds }: Props) {
  const plan = buildPersonalStudyPlan({ activeUnit, completedChallengeIds });
  const done = plan.weeks.filter((w) => w.status === "done").length;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Your study plan</h3>
          <p className="text-sm text-muted-foreground">
            24 weeks, 45 minutes a day. Each week has a focus (sounds first, then one or two
            units), its challenges and a milestone: what you should be able to do by the end of it.
            The current week comes from your active unit in Your path; challenges are counted
            automatically when you submit them.
          </p>
        </div>

        <div className="space-y-3 rounded-bubble border border-primary/40 bg-primary-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            Week {plan.current.week} of 24 · {plan.current.focusEs}
          </p>
          <Stagger as="ul" className="space-y-1">
            {plan.thisWeekEs.map((task) => (
              <StaggerItem as="li" key={task} className="flex items-start gap-2">
                <Circle className="mt-1 h-3 w-3 shrink-0 text-primary" />
                <span>{task}</span>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="text-xs text-muted-foreground">
            {done === 0 ? "Just getting started: no week closed yet." : `${done} week(s) closed.`}
          </p>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-2">Week</th>
                <th className="p-2">What to study</th>
                <th className="p-2">Challenges</th>
                <th className="p-2">By the end of the week you can…</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {plan.weeks.map((week) => (
                <WeekRow key={week.week} week={week} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Your daily routine (45 minutes)</h3>
        <Stagger as="ul" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(DAILY_DISTRIBUTION).map(([key, minutes]) => {
            const k = key as keyof typeof DAILY_DISTRIBUTION;
            return (
              <StaggerItem as="li" key={key} className="rounded-md border p-3 text-center text-sm">
                <p className="font-medium">{DAILY_LABELS[k]}</p>
                <p className="text-muted-foreground">{minutes} min</p>
                <p className="mt-1 text-xs text-muted-foreground">{DAILY_HELP[k]}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">The 7-step cycle and the 10 rules of the method</h3>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="cycle">
            <AccordionTrigger>7-step cycle</AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2">
                {SEVEN_STEP_CYCLE.map((step) => (
                  <li key={step.step} className="text-sm">
                    <span className="font-medium">
                      {step.name} ({step.minutes} min)
                    </span>{" "}
                    — {step.purpose}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="rules">
            <AccordionTrigger>10 rules of the method</AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2">
                {METHOD_RULES.map((rule) => (
                  <li key={rule.id} className="text-sm">
                    <span className="font-medium">{rule.rule}</span> — {rule.detail}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
