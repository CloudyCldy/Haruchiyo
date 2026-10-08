import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

jest.mock("jose", () => ({ jwtVerify: jest.fn(), SignJWT: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: {
  apiClient: { findFirst: jest.fn() },
  project: { findUnique: jest.fn() },
  sprint: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
  backlogItem: { updateMany: jest.fn(), findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
} }));

const P = "507f1f77bcf86cd799439011";
const ITEM = "507f1f77bcf86cd799439022";
const m = (fn: unknown) => fn as jest.Mock;
const req = (url: string, method = "GET", body?: unknown, key: string | null = "ok") =>
  new NextRequest(`http://localhost${url}`, { method, headers: { "content-type": "application/json", ...(key ? { "X-Api-Key": key } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });

beforeEach(() => {
  jest.clearAllMocks();
  m(prisma.apiClient.findFirst).mockResolvedValue({ id: "client" });
  m(prisma.project.findUnique).mockResolvedValue({ id: P });
});

describe("Partner backlog (Haitani → Sanzu)", () => {
  it("requires the API key", async () => {
    const { GET } = await import("../app/api/partner/projects/[externalRef]/backlog/route");
    const res = await GET(req("/api/v1/partner/projects/haitani-proj-1/backlog", "GET", undefined, null), { params: Promise.resolve({ externalRef: "haitani-proj-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the project was never synced", async () => {
    m(prisma.project.findUnique).mockResolvedValue(null);
    const { GET } = await import("../app/api/partner/projects/[externalRef]/backlog/route");
    const res = await GET(req("/api/v1/partner/projects/x/backlog"), { params: Promise.resolve({ externalRef: "x" }) });
    expect(res.status).toBe(404);
  });

  it("lists items by priority and supports the 'none' sprint filter", async () => {
    m(prisma.backlogItem.findMany).mockResolvedValue([{ id: "a", priority: "LOW" }, { id: "b", priority: "CRITICAL" }]);
    const { GET } = await import("../app/api/partner/projects/[externalRef]/backlog/route");
    const res = await GET(req("/api/v1/partner/projects/haitani-proj-1/backlog?type=BUG&sprintId=none"), { params: Promise.resolve({ externalRef: "haitani-proj-1" }) });
    expect(res.status).toBe(200);
    expect((await res.json()).data.map((i: any) => i.id)).toEqual(["b", "a"]);
    expect(m(prisma.backlogItem.findMany).mock.calls[0][0].where).toEqual({ projectId: P, type: "BUG", sprintId: null });
  });

  it("creates an item and validates the payload", async () => {
    m(prisma.backlogItem.create).mockImplementation(async ({ data }: any) => ({ id: ITEM, ...data }));
    const { POST } = await import("../app/api/partner/projects/[externalRef]/backlog/route");
    const ctx = { params: Promise.resolve({ externalRef: "haitani-proj-1" }) };
    const good = await POST(req("/api/v1/partner/projects/haitani-proj-1/backlog", "POST", { title: "Login", type: "USER_STORY", storyPoints: 3 }), ctx);
    expect(good.status).toBe(201);
    expect((await good.json()).data).toMatchObject({ projectId: P, title: "Login", storyPoints: 3 });
    const bad = await POST(req("/api/v1/partner/projects/haitani-proj-1/backlog", "POST", { title: "", type: "NOPE" }), ctx);
    expect(bad.status).toBe(422);
  });

  it("updates status one step and rejects jumps", async () => {
    const { PUT } = await import("../app/api/partner/projects/[externalRef]/backlog/[itemId]/route");
    const ctx = { params: Promise.resolve({ externalRef: "haitani-proj-1", itemId: ITEM }) };
    m(prisma.backlogItem.findUnique).mockResolvedValue({ id: ITEM, projectId: P, status: "BACKLOGGED" });
    m(prisma.backlogItem.update).mockResolvedValue({ id: ITEM, status: "READY" });
    expect((await PUT(req("/x", "PUT", { status: "READY" }), ctx)).status).toBe(200);
    expect((await PUT(req("/x", "PUT", { status: "DONE" }), ctx)).status).toBe(409);
  });

  it("does not touch items from another project", async () => {
    const { DELETE } = await import("../app/api/partner/projects/[externalRef]/backlog/[itemId]/route");
    m(prisma.backlogItem.findUnique).mockResolvedValue({ id: ITEM, projectId: "507f1f77bcf86cd799439099" });
    const res = await DELETE(req("/x", "DELETE"), { params: Promise.resolve({ externalRef: "haitani-proj-1", itemId: ITEM }) });
    expect(res.status).toBe(404);
    expect(prisma.backlogItem.delete).not.toHaveBeenCalled();
  });

  it("lists sprints of the project", async () => {
    m(prisma.sprint.findMany).mockResolvedValue([{ id: "s1", name: "Sprint 2" }]);
    const { GET } = await import("../app/api/partner/projects/[externalRef]/sprints/route");
    const res = await GET(req("/x"), { params: Promise.resolve({ externalRef: "haitani-proj-1" }) });
    expect((await res.json()).data).toEqual([{ id: "s1", name: "Sprint 2" }]);
  });
  it("syncs Haitani sprints: creates new ones, updates existing and removes deleted ones", async () => {
    m(prisma.sprint.findMany)
      .mockResolvedValueOnce([{ id: "s1", externalRef: "haitani-sprint-1" }, { id: "s9", externalRef: "haitani-sprint-9" }])
      .mockResolvedValueOnce([{ id: "s1", name: "Sprint 1" }, { id: "s2", name: "Sprint 2" }]);
    const { PUT } = await import("../app/api/partner/projects/[externalRef]/sprints/route");
    const res = await PUT(req("/x", "PUT", { sprints: [
      { externalRef: "haitani-sprint-1", name: "Sprint 1", startDate: "2026-09-14", endDate: "2026-09-25", status: "COMPLETED" },
      { externalRef: "haitani-sprint-2", name: "Sprint 2", startDate: "2026-09-28", endDate: "2026-10-09", status: "ACTIVE" },
    ] }), { params: Promise.resolve({ externalRef: "haitani-proj-1" }) });
    expect(res.status).toBe(200);
    expect(m(prisma.sprint.update).mock.calls[0][0]).toMatchObject({ where: { id: "s1" }, data: { name: "Sprint 1", status: "COMPLETED" } });
    expect(m(prisma.sprint.create).mock.calls[0][0].data).toMatchObject({ projectId: P, externalRef: "haitani-sprint-2", status: "ACTIVE" });
    expect(m(prisma.backlogItem.updateMany).mock.calls[0][0]).toEqual({ where: { projectId: P, sprintId: { in: ["s9"] } }, data: { sprintId: null } });
    expect(m(prisma.sprint.deleteMany).mock.calls[0][0]).toEqual({ where: { id: { in: ["s9"] } } });
    expect((await res.json()).data).toHaveLength(2);
  });

  it("rejects an invalid sprint list", async () => {
    const { PUT } = await import("../app/api/partner/projects/[externalRef]/sprints/route");
    const res = await PUT(req("/x", "PUT", { sprints: [{ externalRef: "haitani-sprint-1", name: "", startDate: "2026-10-09", endDate: "2026-09-28" }] }), { params: Promise.resolve({ externalRef: "haitani-proj-1" }) });
    expect(res.status).toBe(422);
    expect(prisma.sprint.create).not.toHaveBeenCalled();
  });
});