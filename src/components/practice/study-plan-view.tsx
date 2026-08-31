"use client";

/**
 * Plan de estudio: las 24 semanas del Apéndice J, la distribución diaria de
 * 45 minutos, el ciclo de 7 pasos y las 10 reglas del método en acordeón.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { STUDY_PLAN_24_WEEKS, DAILY_DISTRIBUTION } from "@/domain/curriculum/study-plan";
import { SEVEN_STEP_CYCLE } from "@/domain/curriculum/seven-step-cycle";
import { METHOD_RULES } from "@/domain/curriculum/method-rules";

const DAILY_LABELS: Record<keyof typeof DAILY_DISTRIBUTION, string> = {
  repaso: "Repaso",
  input: "Input",
  notice: "Notice",
  practice: "Practice",
  output: "Output",
};

export function StudyPlanView() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Plan de 24 semanas</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-2">Semana</th>
                <th className="p-2">Contenido</th>
                <th className="p-2">Hito</th>
              </tr>
            </thead>
            <tbody>
              {STUDY_PLAN_24_WEEKS.map((week) => (
                <tr key={week.week} className="border-t">
                  <td className="p-2 font-medium">{week.week}</td>
                  <td className="p-2">{week.content}</td>
                  <td className="p-2 text-muted-foreground">{week.milestone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Distribución diaria (45 minutos)</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(DAILY_DISTRIBUTION).map(([key, minutes]) => (
            <li key={key} className="rounded-md border p-3 text-center text-sm">
              <p className="font-medium">{DAILY_LABELS[key as keyof typeof DAILY_DISTRIBUTION]}</p>
              <p className="text-muted-foreground">{minutes} min</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">El ciclo de 7 pasos y las 10 reglas del método</h3>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="cycle">
            <AccordionTrigger>Ciclo de 7 pasos</AccordionTrigger>
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
            <AccordionTrigger>10 reglas del método</AccordionTrigger>
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
