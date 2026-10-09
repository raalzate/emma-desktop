"use client";

/**
 * Envoltorio compartido de las seis subrutas de Práctica (H6, #199): la
 * guarda de perfil incompleto, el shell y la cabecera son los mismos en
 * todas; cada subruta sólo aporta su título y el componente de la sección.
 */

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEmma } from "@/interface/emma-context";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { AppShell } from "@/components/nav/app-shell";
import { CardEnter } from "@/components/motion";
import { PageHeader, type PageHeaderBack } from "@/components/nav/page-header";

// Cada sección es parte de Práctica: se vuelve ahí, no a la ruta.
const BACK_TO_PRACTICE: PageHeaderBack = { href: "/practice", label: "Practice" };

interface Props {
  title: string;
  children: (runtime: EmmaRuntime) => ReactNode;
}

export function PracticeRouteShell({ title, children }: Props) {
  const { runtime, profile, ready } = useEmma();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  if (!ready || !runtime) return null;
  if (!profile) return null; // redirigiendo al onboarding

  return (
    <AppShell>
      <PageHeader title={title} back={BACK_TO_PRACTICE} />
      <CardEnter className="mx-auto w-full max-w-6xl space-y-6 p-6">{children(runtime)}</CardEnter>
    </AppShell>
  );
}
