import { ConflictError } from "@/lib/errors";
import { parse, sprintSchema } from "@/validators/schemas";
import { createTask, updateBacklogItem } from "@/services/work.service";
import { prisma } from "@/lib/prisma";

jest.mock("jose", () => ({ jwtVerify: jest.fn(), SignJWT: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: {
  sprint: { findFirst: jest.fn(), findUnique: jest.fn() },
  task: { create: jest.fn() },
  backlogItem: { findUnique: jest.fn(), update: jest.fn() },
  project: { findFirst: jest.fn() }
} }));

describe("Sprint 2 work management", () => {
  it("creates a task assigned to a sprint in the same project", async () => {
    (prisma.sprint.findFirst as jest.Mock).mockResolvedValue({ id: "sprint-1", projectId: "project-1" });
    (prisma.task.create as jest.Mock).mockResolvedValue({ id: "task-1", projectId: "project-1" });
    await expect(createTask("project-1", { title: "Build board", sprintId: "sprint-1" })).resolves.toEqual({ id: "task-1", projectId: "project-1" });
  });

  it("rejects an invalid sprint date range", () => {
    expect(() => parse(sprintSchema, { name: "Sprint 1", startDate: "2026-09-20", endDate: "2026-09-19" })).toThrow("startDate");
  });

  it("rejects an invalid backlog transition", async () => {
    (prisma.backlogItem.findUnique as jest.Mock).mockResolvedValue({ id: "item-1", projectId: "project-1", status: "BACKLOGGED" });
    await expect(updateBacklogItem("item-1", "project-1", { status: "DONE" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("represents denied project access with the authorization error", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);
    const { requireProjectAccess } = await import("@/lib/auth");
    await expect(requireProjectAccess("user-1", "507f1f77bcf86cd799439011")).rejects.toMatchObject({ name: "AuthorizationError" });
  });
});