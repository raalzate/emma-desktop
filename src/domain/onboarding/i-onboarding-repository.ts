/**
 * Puertos del onboarding (patrón hexagonal). El caso de uso depende SOLO de
 * estas interfaces; la persistencia real (SQLite) y la UI (Electron/React) se
 * inyectan desde fuera. El perfil está ligado a una única cuenta local, así que
 * el repositorio no necesita un `userId` en cada llamada.
 */

import type { UserProfile } from "@/domain/profile/user-profile";

export interface OnboardingRepository {
  /** Perfil actual, o null si el usuario aún no existe. */
  getStatus(): Promise<UserProfile | null>;
  /** Crea un perfil vacío y lo devuelve. */
  createEmpty(): Promise<UserProfile>;
  /** Persiste el valor normalizado de un paso (nombre de paso en snake_case). */
  saveStep(step: string, value: string | number): Promise<void>;
  /** Marca el onboarding como completado. */
  markCompleted(): Promise<void>;
}

/**
 * Canal de UI que necesita un colector: preguntar al usuario y, opcionalmente,
 * enviar mensajes sueltos (guía, saludo al retomar). Flujo estricto por turnos:
 * un `ask` bloquea hasta la respuesta del usuario.
 */
export interface OnboardingIo {
  ask(prompt: string): Promise<string>;
  notify?(message: string): void | Promise<void>;
}
