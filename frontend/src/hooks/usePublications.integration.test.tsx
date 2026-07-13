/**
 * Test de integración de Fase 2: usePublications (hook) + cliente API real
 * (`fetch` sin mockear a nivel de módulo) + estado de react-query, todo
 * frente a un servidor HTTP simulado con MSW (Mock Service Worker) — no hay
 * backend real levantado, pero tampoco se mockea `api.get`/`fetch`
 * directamente: la integración hook → api.ts (fetch) → QueryClient es real,
 * solo la respuesta HTTP está controlada.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { usePublications } from "./usePublications";
import type { Paginated, Publication } from "@/lib/api";

const BASE_URL = "http://localhost:3001";

function makePublication(overrides: Partial<Publication> = {}): Publication {
  return {
    id: 1,
    contentHash: "0x" + "a".repeat(64),
    title: "Artículo de prueba",
    body: "cuerpo",
    authorAddress: "0x1111111111111111111111111111111111111111",
    tags: ["a"],
    ipfsCid: null,
    consensusState: "PENDING",
    currentResult: null,
    currentRound: 0,
    reopenRequestCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const server = setupServer();

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("usePublications (integración hook + cliente API + react-query, servidor simulado con MSW)", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("expone los datos cuando la API responde 200 con publicaciones", async () => {
    const payload: Paginated<Publication> = {
      items: [makePublication({ id: 1, title: "Uno" }), makePublication({ id: 2, title: "Dos" })],
      page: 1,
      limit: 20,
      total: 2,
    };
    server.use(
      http.get(`${BASE_URL}/api/v1/publications`, () => HttpResponse.json(payload)),
    );

    const { result } = renderHook(() => usePublications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.total).toBe(2);
    expect(result.current.data?.items[0].title).toBe("Uno");
  });

  it("expone un estado vacío cuando la API responde 200 sin publicaciones", async () => {
    const payload: Paginated<Publication> = { items: [], page: 1, limit: 20, total: 0 };
    server.use(http.get(`${BASE_URL}/api/v1/publications`, () => HttpResponse.json(payload)));

    const { result } = renderHook(() => usePublications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toEqual([]);
    expect(result.current.data?.total).toBe(0);
  });

  it("expone un estado de error (ApiError) cuando la API responde con un código de error conocido", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/publications`, () =>
        HttpResponse.json({ error: { code: "INTERNAL_ERROR", message: "fallo simulado" } }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => usePublications(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("fallo simulado");
  });

  it("reacciona a un cambio de filtros (paginación) disparando una nueva petición con la query string correcta", async () => {
    const page1: Paginated<Publication> = {
      items: [makePublication({ id: 1, title: "Página 1" })],
      page: 1,
      limit: 1,
      total: 2,
    };
    const page2: Paginated<Publication> = {
      items: [makePublication({ id: 2, title: "Página 2" })],
      page: 2,
      limit: 1,
      total: 2,
    };

    const seenUrls: string[] = [];
    server.use(
      http.get(`${BASE_URL}/api/v1/publications`, ({ request }) => {
        const url = new URL(request.url);
        seenUrls.push(url.search);
        return HttpResponse.json(url.searchParams.get("page") === "2" ? page2 : page1);
      }),
    );

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => usePublications({ page, limit: 1 }),
      { wrapper, initialProps: { page: 1 } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0].title).toBe("Página 1");

    rerender({ page: 2 });

    await waitFor(() => expect(result.current.data?.items[0].title).toBe("Página 2"));
    expect(seenUrls.some((s) => s.includes("page=2") && s.includes("limit=1"))).toBe(true);
    expect(seenUrls.some((s) => s.includes("page=1") && s.includes("limit=1"))).toBe(true);
  });

  it("filtra por estado y etiqueta: la query string enviada refleja los filtros del hook", async () => {
    let capturedSearch = "";
    server.use(
      http.get(`${BASE_URL}/api/v1/publications`, ({ request }) => {
        capturedSearch = new URL(request.url).search;
        return HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 } satisfies Paginated<Publication>);
      }),
    );

    const { result } = renderHook(
      () => usePublications({ state: "DEFINITIVE", result: "TRUE", tags: ["politica", "salud"] }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedSearch).toContain("state=DEFINITIVE");
    expect(capturedSearch).toContain("result=TRUE");
    expect(capturedSearch).toContain("tags=politica%2Csalud");
  });
});
