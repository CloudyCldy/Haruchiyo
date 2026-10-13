import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

jest.mock("jose", () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    apiClient: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const USER_ID = "507f1f77bcf86cd799439011";

describe("User API Credentials (/api/users/me/credentials)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("../app/api/users/me/credentials/route");
    const req = new NextRequest("http://localhost:3000/api/users/me/credentials");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns existing API Key, Token, and URL when authenticated", async () => {
    const { jwtVerify } = await import("jose");
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: { userId: USER_ID } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_ID,
      name: "Haruchiyo Sanzu",
      email: "sanzu@ops.internal",
      role: "PROJECT_MANAGER",
    });
    (prisma.apiClient.findFirst as jest.Mock).mockResolvedValue({
      id: "client-1",
      userId: USER_ID,
      rawKey: "sz_live_existing_secret_key_12345",
      keyHash: "somehash",
      active: true,
    });

    const { GET } = await import("../app/api/users/me/credentials/route");
    const req = new NextRequest("http://localhost:3000/api/users/me/credentials", {
      headers: {
        authorization: "Bearer mock-token-xyz",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.apiKey).toBe("sz_live_existing_secret_key_12345");
    expect(body.data.token).toBe("mock-token-xyz");
    expect(body.data.url).toContain("/api");
    expect(body.data.baseUrl).toBeTruthy();
    expect(Array.isArray(body.data.endpoints)).toBe(true);
  });

  it("generates a new API Key when user has none", async () => {
    const { jwtVerify } = await import("jose");
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: { userId: USER_ID } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_ID,
      name: "Haruchiyo Sanzu",
      email: "sanzu@ops.internal",
      role: "PROJECT_MANAGER",
    });
    (prisma.apiClient.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.apiClient.create as jest.Mock).mockImplementation(async ({ data }) => ({
      id: "client-new",
      ...data,
    }));

    const { GET } = await import("../app/api/users/me/credentials/route");
    const req = new NextRequest("http://localhost:3000/api/users/me/credentials", {
      headers: {
        authorization: "Bearer mock-token-xyz",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.apiKey).toMatch(/^sz_live_/);
    expect(prisma.apiClient.create).toHaveBeenCalled();
  });

  it("rotates API Key on POST", async () => {
    const { jwtVerify } = await import("jose");
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: { userId: USER_ID } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_ID,
      name: "Haruchiyo Sanzu",
      email: "sanzu@ops.internal",
      role: "PROJECT_MANAGER",
    });
    (prisma.apiClient.findFirst as jest.Mock).mockResolvedValue({
      id: "client-1",
      userId: USER_ID,
      rawKey: "sz_live_old_key",
      active: true,
    });
    (prisma.apiClient.update as jest.Mock).mockImplementation(async ({ data }) => ({
      id: "client-1",
      ...data,
    }));

    const { POST } = await import("../app/api/users/me/credentials/route");
    const req = new NextRequest("http://localhost:3000/api/users/me/credentials", {
      method: "POST",
      headers: {
        authorization: "Bearer mock-token-xyz",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.apiKey).toMatch(/^sz_live_/);
    expect(prisma.apiClient.update).toHaveBeenCalled();
  });
});
