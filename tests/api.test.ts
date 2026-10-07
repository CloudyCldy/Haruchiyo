import { NextRequest } from "next/server";
import { ZodError, z } from "zod";
import { handleError } from "@/lib/http";
import { AuthenticationError, ConflictError, ERROR_CODES } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { updateBacklogItem } from "@/services/work.service";

jest.mock("jose", () => ({ jwtVerify: jest.fn(), SignJWT: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: {
  apiClient: { findFirst: jest.fn() },
  project: { findFirst: jest.fn() },
  user: { findUnique: jest.fn() },
  sprint: { findFirst: jest.fn() },
  backlogItem: { findUnique: jest.fn(), update: jest.fn() },
} }));

const body = async (res: Response) => res.json();

describe("SB-01 error codes", () => {
  it("maps every error type to its documented code and status", async () => {
    const cases: [unknown, string][] = [
      [new AuthenticationError("x"), "UNAUTHORIZED"],
      [new ConflictError("x"), "CONFLICT"],
      [Object.assign(new Error("x"), { code: "P2025" }), "NOT_FOUND"],
      [Object.assign(new Error("x"), { code: "P2002" }), "CONFLICT"],
      [new SyntaxError("bad json"), "BAD_REQUEST"],
      [(() => { try { z.string().parse(1); } catch (e) { return e as ZodError; } })(), "VALIDATION_ERROR"],
    ];
    for (const [error, code] of cases) {
      const res = handleError(error);
      expect(res.status).toBe((ERROR_CODES as any)[code].status);
      expect((await body(res)).error.code).toBe(code);
    }
  });
});

describe("SB-04 backlog transitions", () => {
  it("allows moving one step forward or back, and rejects jumps", async () => {
    (prisma.backlogItem.findUnique as jest.Mock).mockResolvedValue({ id: "i", status: "IN_PROGRESS" });
    (prisma.backlogItem.update as jest.Mock).mockResolvedValue({ id: "i", status: "READY" });
    await expect(updateBacklogItem("i", "p", { status: "READY" })).resolves.toMatchObject({ status: "READY" });
    (prisma.backlogItem.findUnique as jest.Mock).mockResolvedValue({ id: "i", status: "BACKLOGGED" });
    await expect(updateBacklogItem("i", "p", { status: "IN_PROGRESS" })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("INT-01 POST /api/v1/projects/:id/context", () => {
  const call = async (headers: Record<string, string>, payload: unknown) => {
    const { POST } = await import("../app/api/projects/[id]/context/route");
    const req = new NextRequest("http://localhost/api/v1/projects/haitani-proj-1/context", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(payload) });
    return POST(req, { params: Promise.resolve({ id: "haitani-proj-1" }) });
  };

  it("returns 401 without credentials", async () => {
    const res = await call({}, { project: { name: "x" } });
    expect(res.status).toBe(401);
    expect((await body(res)).error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 with an invalid API key", async () => {
    (prisma.apiClient.findFirst as jest.Mock).mockResolvedValue(null);
    expect((await call({ "X-Api-Key": "nope" }, { project: { name: "x" } })).status).toBe(401);
  });

  it("returns 422 for an invalid payload", async () => {
    (prisma.apiClient.findFirst as jest.Mock).mockResolvedValue({ id: "c" });
    const res = await call({ "X-Api-Key": "ok" }, { tasks: [] });
    expect(res.status).toBe(422);
  });

  it("analyzes the context with a valid API key", async () => {
    (prisma.apiClient.findFirst as jest.Mock).mockResolvedValue({ id: "c" });
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "507f1f77bcf86cd799439011" });
    const res = await call({ "X-Api-Key": "ok" }, { project: { name: "Demo", methodology: "KANBAN" }, tasks: [{ title: "A", status: "bloqueada" }] });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-API-Version")).toBe("v1");
    const json = await body(res);
    expect(json.data).toMatchObject({ synced: true, sanzuProjectId: "507f1f77bcf86cd799439011", externalRef: "haitani-proj-1", methodology: "KANBAN" });
    expect(json.data.blockedTasks).toHaveLength(1);
  });
});