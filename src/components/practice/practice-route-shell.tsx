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
import { PageHeader } from "@/components/nav/page-header";

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
      <PageHeader title={title} />
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">{children(runtime)}</div>
    </AppShell>
  );
}
