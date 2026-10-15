import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { inferPhase, parsePhase, recommendDocuments, searchDocumentation } from "@/services/document-recommendation.service";

jest.mock("jose", () => ({ jwtVerify: jest.fn(), SignJWT: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: { apiClient: { findFirst: jest.fn() }, project: { findUnique: jest.fn() } } }));
const m = (fn: unknown) => fn as jest.Mock;
const req = (url: string, key: string | null = "ok") => new NextRequest(`http://localhost${url}`, { headers: key ? { "X-Api-Key": key } : {} });

describe("SB-13 · ST054 búsqueda de documentación", () => {
  it("finds documentation ranked by relevance", () => {
    const result = searchDocumentation({ q: "sprint backlog", limit: 5 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.results.length).toBeLessThanOrEqual(5);
    const scores = result.results.map(r => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(result.results[0]).toEqual(expect.objectContaining({ documentTitle: expect.any(String), snippet: expect.any(String), citation: expect.any(String) }));
  });

  it("GET /documentation/search validates the query", async () => {
    const { GET } = await import("../app/api/documentation/search/route");
    expect((await GET(req("/api/v1/documentation/search?q=a"))).status).toBe(422);
    const ok = await GET(req("/api/v1/documentation/search?q=riesgos&methodology=SCRUM&limit=3"));
    expect(ok.status).toBe(200);
    expect((await ok.json()).data.results.length).toBeLessThanOrEqual(3);
  });
});

describe("SB-13 · ST055 recomendación por proyecto, metodología y fase", () => {
  it("infers the phase from status and timeline", () => {
    const now = new Date("2026-10-15");
    expect(inferPhase({ status: "PLANNING" }, now)).toBe("INICIO");
    expect(inferPhase({ status: "COMPLETED" }, now)).toBe("CIERRE");
    expect(inferPhase({ status: "ACTIVE", startDate: "2026-09-14", endDate: "2026-11-20" }, now)).toBe("EJECUCION");
    expect(inferPhase({ status: "ACTIVE", startDate: "2026-09-14", endDate: "2026-10-16" }, now)).toBe("CIERRE");
    expect(parsePhase("ejecución")).toBe("EJECUCION");
    expect(parsePhase("otra")).toBeUndefined();
  });

  it("recommends different material for each phase of the methodology", () => {
    const start = recommendDocuments({ methodology: "SCRUM", phase: "INICIO" });
    const end = recommendDocuments({ methodology: "SCRUM", phase: "CIERRE" });
    expect(start).toEqual(expect.objectContaining({ methodology: "SCRUM", phase: "INICIO", phaseLabel: expect.any(String) }));
    expect(start.checklists.every(c => c.stage === "READY")).toBe(true);
    expect(end.checklists.every(c => ["RELEASE", "SECURITY"].includes(c.stage))).toBe(true);
    expect(start.readings.length).toBeGreaterThan(0);
  });

  it("partner route uses the synced project and rejects an unknown phase", async () => {
    m(prisma.apiClient.findFirst).mockResolvedValue({ id: "client" });
    m(prisma.project.findUnique).mockResolvedValue({ status: "ACTIVE", startDate: null, endDate: null, methodologyId: "KANBAN" });
    const { GET } = await import("../app/api/partner/projects/[externalRef]/documents/recommended/route");
    const ctx = { params: Promise.resolve({ externalRef: "haitani-proj-1" }) };
    const res = await GET(req("/x?phase=CIERRE"), ctx);
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ methodology: "KANBAN", phase: "CIERRE" });
    expect((await GET(req("/x?phase=FINAL"), ctx)).status).toBe(422);
    expect((await GET(req("/x", null), ctx)).status).toBe(401);
  });
});