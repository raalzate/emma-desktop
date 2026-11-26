/**
 * #198 (FR-006) — la entrada por deep-link `/chat?scenario=` respeta el mismo
 * gate que el trazado: si hay lecciones pendientes que no apuntan a esa
 * escena, no arranca el chat, sino el aviso.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/interface/emma-context", () => ({
  useEmma: () => ({
    runtime: {},
    profile: { englishLevel: "B1", onboardingState: "completed" },
    settings: {},
    ready: true,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => (key === "scenario" ? "s3" : null) }),
  usePathname: () => "/chat",
}));

vi.mock("@/components/progress/use-progress-data", () => ({
  useProgressData: () => ({
    roadmap: {
      currentLevel: "B1",
      levels: [
        {
          cefrLevel: "B1",
          state: "in_progress",
          pathway: {
            cefrLevel: "B1",
            items: [
              { scenarioType: "s1", title: "Ordering Coffee", status: "passed" },
              { scenarioType: "s2", title: "At the Café", status: "pending" },
              { scenarioType: "s3", title: "Job Interview", status: "pending" },
            ],
          },
        },
      ],
    },
    loading: false,
  }),
}));

let mockPendingTodos: unknown[] = [];
vi.mock("@/components/lessons/use-lesson-todos", () => ({
  useLessonTodos: () => ({ todos: mockPendingTodos, pending: mockPendingTodos }),
}));

// Las escenas s1..s3 son ficticias: el nivel lo resuelve el dominio (#375),
// que aquí se fija para probar sólo el gate.
let mockRequest: { kind: string; scenario?: { title: string } } = { kind: "ok", scenario: { title: "Job Interview" } };
vi.mock("@/domain/scenarios/scenario-request", () => ({
  resolveScenarioRequest: () => mockRequest,
}));

vi.mock("@/components/chat/chat-view", () => ({
  ChatView: () => createElement("div", null, "CHAT_VIEW_MARKER"),
}));

async function render(): Promise<string> {
  const { default: ChatPage } = await import("@/app/chat/page");
  return renderToStaticMarkup(createElement(ChatPage));
}

// Import dinámico tras vi.resetModules: en frío y con la suite en paralelo pasa de 5 s.
describe("ChatPage — gate de la entrada por deep-link (FR-006, #198)", { timeout: 20_000 }, () => {
  it("sin lecciones pendientes, abre el chat con la escena pedida", async () => {
    mockPendingTodos = [];
    const html = await render();
    expect(html).toContain("CHAT_VIEW_MARKER");
  });

  it("con una lección pendiente ajena a la escena pedida, muestra el aviso en vez del chat", async () => {
    mockPendingTodos = [
      {
        id: "exercise:u13-fill:1",
        kind: "exercise",
        target: "u13-fill",
        titleEs: "Ejercicio",
        reasonEs: "razón",
        href: "/practice?tab=exercises&unit=13&exercise=u13-fill",
        origin: { sessionAt: 1, scenarioType: "s1", scenarioTitle: "Ordering Coffee" },
        status: "pending",
        createdAt: 1,
      },
    ];
    const html = await render();
    mockPendingTodos = [];
    expect(html).not.toContain("CHAT_VIEW_MARKER");
    expect(html).toContain("Finish your pending lessons to unlock the next scene");
    expect(html).toMatch(/href="\/practice\/?"/);
  });

  it("una escena de otro nivel avisa en vez de abrir otra en silencio (#375)", async () => {
    mockPendingTodos = [];
    mockRequest = { kind: "other-level", scenario: { title: "Job Interview" } };
    const html = await render();
    mockRequest = { kind: "ok", scenario: { title: "Job Interview" } };
    expect(html).not.toContain("CHAT_VIEW_MARKER");
    expect(html).toContain("isn’t part of level B1");
    expect(html).toContain("Go to my scenes");
  });
});
