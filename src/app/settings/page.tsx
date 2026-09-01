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
import { PageHeader } from "@/components/nav/page-header";

export default function SettingsPage() {
  return (
    <>
    <PageHeader title="Configuración" />
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Personaliza a Emma y gestiona los modelos de IA. EMMA es local-first: todo
          funciona en tu equipo; la nube es opcional.
        </p>
      </header>

      <Tabs defaultValue="personality">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personality">Emma (tutora)</TabsTrigger>
          <TabsTrigger value="personas">Protopersonas</TabsTrigger>
          <TabsTrigger value="local">Modelo local</TabsTrigger>
          <TabsTrigger value="remote">IA en la nube</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
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
    </main>
    </>
  );
}
