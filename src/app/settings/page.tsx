"use client";

/**
 * Vista de Configuración de EMMA. Agrupa en pestañas los cuatro dominios de
 * ajustes: personalidad de la tutora, modelo local (Gemma/LiteRT), IA en la nube
 * (híbrido/remoto) e información del sistema. Cada pestaña delega en su propio
 * componente para respetar el límite de tamaño por archivo.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalityForm } from "@/components/settings/personality-form";
import { PersonaTuningForm } from "@/components/settings/persona-tuning-form";
import { ModelManager } from "@/components/settings/model-manager";
import { RemoteAiConfig } from "@/components/settings/remote-ai-config";
import { SystemInfoCard } from "@/components/settings/system-info-card";
import { UpdatesCard } from "@/components/settings/updates-card";
import { DataManagementCard } from "@/components/settings/data-management-card";
import { AppShell } from "@/components/nav/app-shell";
import { PageHeader } from "@/components/nav/page-header";

export default function SettingsPage() {
  return (
    <AppShell>
    <PageHeader title="Settings" />
    {/* div y no <main>: el AppShell ya aporta el <main> del layout */}
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Personalize Emma and manage the AI models. EMMA is local-first: everything
          runs on your device; the cloud is optional.
        </p>
      </header>

      <Tabs defaultValue="personality">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personality" title="Tono, actitud y estilo con que Emma te enseña">Emma (tutor)</TabsTrigger>
          <TabsTrigger value="personas" title="Personajes con los que practicás en cada escena y cómo se comportan">Protopersonas</TabsTrigger>
          <TabsTrigger value="local" title="Modelo de IA que corre en tu equipo, sin internet">Local model</TabsTrigger>
          <TabsTrigger value="remote" title="Proveedor en la nube opcional, con tu propia clave">Cloud AI</TabsTrigger>
          <TabsTrigger value="system" title="Datos de tu equipo, versión instalada y actualizaciones de la app">System</TabsTrigger>
          <TabsTrigger value="data" title="Borra chats, reinicia el onboarding o elimina todos tus datos locales">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="personality">
          <PersonalityForm />
        </TabsContent>
        <TabsContent value="personas">
          <PersonaTuningForm />
        </TabsContent>
        <TabsContent value="local">
          <ModelManager />
        </TabsContent>
        <TabsContent value="remote">
          <RemoteAiConfig />
        </TabsContent>
        <TabsContent value="system">
          <SystemInfoCard />

          <UpdatesCard />
        </TabsContent>
        <TabsContent value="data">
          <DataManagementCard />
        </TabsContent>
      </Tabs>
    </div>
    </AppShell>
  );
}
