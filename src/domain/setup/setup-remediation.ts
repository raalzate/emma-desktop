/**
 * Catálogo causa → remediación (FR-030). Cada entrada es una acción ejecutable por
 * la UI o un texto de pasos, nunca un mensaje genérico. `Record<SetupCause, …>`
 * obliga a que una causa nueva traiga su remediación para compilar.
 * Copy de UI en inglés; sólo el tooltip va en español.
 */
import type { ProbeName } from "./setup-probe-result";

export type SetupCause =
  | "no-webgpu" | "low-ram" | "ai-slow-local" | "ai-slow-remote" | "ai-no-response"
  | "ai-empty" | "ai-timeout" | "ai-offline" | "voice-fallback" | "voice-slow"
  | "voice-timeout" | "mic-denied" | "mic-missing";

export type OsName = "mac" | "windows" | "linux";

export type RemediationAction =
  | { kind: "open-cloud-setup" }
  | { kind: "open-model-manager" }
  | { kind: "switch-to-local" }
  | { kind: "retest"; probe: ProbeName }
  | { kind: "open-settings-tab"; tab: "remote" | "local" }
  | { kind: "steps"; os: OsName | "any"; steps: string[] };

export interface Remediation {
  label: string;
  tooltipEs: string;
  action: RemediationAction;
}

const useCloud: Remediation = {
  label: "Use a cloud model instead",
  tooltipEs: "Configura una llave de nube: no necesita GPU ni mucha memoria de tu equipo.",
  action: { kind: "open-cloud-setup" },
};

const checkKey: Remediation = {
  label: "Check your cloud API key",
  tooltipEs: "Abre los ajustes de nube para revisar que la llave sea válida.",
  action: { kind: "open-settings-tab", tab: "remote" },
};

const smallerModel: Remediation = {
  label: "Switch to a smaller local model",
  tooltipEs: "Abre el gestor de modelos para descargar uno más liviano.",
  action: { kind: "open-model-manager" },
};

const retestAi: Remediation = {
  label: "Test the AI again",
  tooltipEs: "Repite sólo la prueba de IA.",
  action: { kind: "retest", probe: "ai" },
};

const retestVoice: Remediation = {
  label: "Test the voice again",
  tooltipEs: "Repite sólo la prueba de voz.",
  action: { kind: "retest", probe: "voice" },
};

const micSteps = (os: OsName, steps: string[]): Remediation => ({
  label: `Allow the microphone on ${{ mac: "macOS", windows: "Windows", linux: "Linux" }[os]}`,
  tooltipEs: "Pasos para dar permiso de micrófono a EMMA en tu sistema operativo.",
  action: { kind: "steps", os, steps },
});

export const REMEDIATIONS: Record<SetupCause, readonly Remediation[]> = {
  "no-webgpu": [useCloud],
  "low-ram": [useCloud],
  "ai-slow-local": [smallerModel, useCloud],
  "ai-slow-remote": [
    {
      label: "Switch to the local model",
      tooltipEs: "Usa el modelo descargado en tu equipo si la nube responde lento.",
      action: { kind: "switch-to-local" },
    },
    retestAi,
  ],
  "ai-no-response": [
    checkKey,
    { label: "Check the local model", tooltipEs: "Abre el gestor de modelos para revisar que el modelo esté completo.", action: { kind: "open-model-manager" } },
    retestAi,
  ],
  "ai-empty": [retestAi, smallerModel],
  "ai-timeout": [smallerModel, useCloud, retestAi],
  "ai-offline": [
    {
      label: "Switch to the local model",
      tooltipEs: "Sin internet, usa el modelo descargado en tu equipo.",
      action: { kind: "switch-to-local" },
    },
    {
      label: "Download a local model",
      tooltipEs: "Abre el gestor de modelos para descargar uno y poder trabajar sin conexión.",
      action: { kind: "open-model-manager" },
    },
  ],
  "voice-fallback": [
    retestVoice,
    {
      label: "Check the voice installation",
      tooltipEs: "Pasos para revisar la instalación de la voz de EMMA y sus permisos.",
      action: {
        kind: "steps",
        os: "any",
        steps: [
          "Close and reopen EMMA to reload the voice engine.",
          "Make sure the app has permission to use audio output.",
          "Run the voice test again.",
        ],
      },
    },
  ],
  "voice-slow": [retestVoice],
  "voice-timeout": [retestVoice],
  "mic-denied": [
    micSteps("mac", [
      "Open System Settings > Privacy & Security > Microphone.",
      "Turn on EMMA in the list.",
      "Restart EMMA and run the check again.",
    ]),
    micSteps("windows", [
      "Open Settings > Privacy & security > Microphone.",
      "Turn on Let desktop apps access your microphone.",
      "Restart EMMA and run the check again.",
    ]),
    micSteps("linux", [
      "Open your system sound settings and check the input device is not muted.",
      "Make sure EMMA has access to audio input (PipeWire or PulseAudio).",
      "Restart EMMA and run the check again.",
    ]),
  ],
  "mic-missing": [
    {
      label: "Connect a microphone",
      tooltipEs: "No se detectó ningún micrófono: conecta uno y repite la prueba.",
      action: { kind: "retest", probe: "mic" },
    },
  ],
};
