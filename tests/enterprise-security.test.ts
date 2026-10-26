import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthClient,
  createEnterpriseApiKey,
  hashApiKey,
  generateApiKeyString,
} from "@/lib/auth";
import { getPartnerProject, getPartnerProjectId } from "@/lib/partner";
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/errors";

jest.mock("jose", () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    apiClient: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

const m = (fn: unknown) => fn as jest.Mock;

describe("Enterprise Security & Granular Authorization (Sanzu)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. API Key Generation and Hashing", () => {
    it("generates cryptographic keys and stores SHA-256 hash without persisting plain text in DB", async () => {
      const createdRecord = {
        id: "client-ent-1",
        name: "Acme Production Key",
        organizationId: "org-acme-123",
        scopes: ["projects:read", "projects:create"],
        createdAt: new Date(),
      };

      m(prisma.apiClient.create).mockResolvedValue(createdRecord);

      const result = await createEnterpriseApiKey({
        name: "Acme Production Key",
        organizationId: "org-acme-123",
        scopes: ["projects:read", "projects:create"],
        expiresInDays: 30,
      });

      expect(result.id).toBe("client-ent-1");
      expect(result.apiKey).toMatch(/^sz_live_/);
      expect(result.keyPrefix).toBe(result.apiKey.slice(0, 12));
      expect(result.organizationId).toBe("org-acme-123");

      const createCall = m(prisma.apiClient.create).mock.calls[0][0];
      expect(createCall.data.name).toBe("Acme Production Key");
      expect(createCall.data.organizationId).toBe("org-acme-123");
      expect(createCall.data.keyHash).toBe(hashApiKey(result.apiKey));
      expect(createCall.data.rawKey).toBeUndefined(); // Raw key never persisted in DB
      expect(createCall.data.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("2. API Key Authentication & Validation (getAuthClient)", () => {
    it("rejects requests missing the X-Api-Key header with 401 AuthenticationError", async () => {
      const req = new NextRequest("http://localhost:3000/api/partner/projects");
      await expect(getAuthClient(req)).rejects.toThrow(AuthenticationError);
      await expect(getAuthClient(req)).rejects.toThrow("API key required");
    });

    it("rejects unknown or invalid API keys with 401 AuthenticationError", async () => {
      m(prisma.apiClient.findFirst).mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/partner/projects", {
        headers: { "X-Api-Key": "sz_live_invalid_key_value_9999" },
      });

      await expect(getAuthClient(req)).rejects.toThrow(AuthenticationError);
      await expect(getAuthClient(req)).rejects.toThrow("Invalid API key");
    });

    it("rejects inactive API keys with 401 AuthenticationError", async () => {
      const rawKey = "sz_live_inactive_client_key";
      m(prisma.apiClient.findFirst).mockResolvedValue({
        id: "c-inactive",
        keyHash: hashApiKey(rawKey),
        active: false,
      });

      const req = new NextRequest("http://localhost:3000/api/partner/projects", {
        headers: { "X-Api-Key": rawKey },
      });

      await expect(getAuthClient(req)).rejects.toThrow("Invalid or inactive API key");
    });

    it("rejects revoked API keys with 401 AuthenticationError", async () => {
      const rawKey = "sz_live_revoked_client_key";
      m(prisma.apiClient.findFirst).mockResolvedValue({
        id: "c-revoked",
        keyHash: hashApiKey(rawKey),
        active: true,
        revokedAt: new Date(Date.now() - 3600_000),
      });

      const req = new NextRequest("http://localhost:3000/api/partner/projects", {
        headers: { "X-Api-Key": rawKey },
      });

      await expect(getAuthClient(req)).rejects.toThrow("API key has been revoked");
    });

    it("rejects expired API keys with 401 AuthenticationError", async () => {
      const rawKey = "sz_live_expired_client_key";
      m(prisma.apiClient.findFirst).mockResolvedValue({
        id: "c-expired",
        keyHash: hashApiKey(rawKey),
        active: true,
        expiresAt: new Date(Date.now() - 3600_000), // Expired 1 hour ago
      });

      const req = new NextRequest("http://localhost:3000/api/partner/projects", {
        headers: { "X-Api-Key": rawKey },
      });

      await expect(getAuthClient(req)).rejects.toThrow("API key has expired");
    });
  });

  describe("3. Granular Scope Enforcement", () => {
    it("rejects requests when the API key lacks the required scope with 403 AuthorizationError", async () => {
      const rawKey = "sz_live_scoped_client_key";
      m(prisma.apiClient.findFirst).mockResolvedValue({
        id: "c-scoped",
        keyHash: hashApiKey(rawKey),
        active: true,
        scopes: ["projects:read"],
      });

      const req = new NextRequest("http://localhost:3000/api/partner/projects", {
        headers: { "X-Api-Key": rawKey },
      });

      // Request requires "projects:create", but key only has "projects:read"
      await expect(getAuthClient(req, "projects:create")).rejects.toThrow(AuthorizationError);
      await expect(getAuthClient(req, "projects:create")).rejects.toThrow(
        "Insufficient API key scopes: requires 'projects:create'"
      );
    });

    it("allows requests when the API key possesses the required scope", async () => {
      const rawKey = "sz_live_valid_scope_client_key";
      m(prisma.apiClient.findFirst).mockResolvedValue({
        id: "c-valid",
        keyHash: hashApiKey(rawKey),
        active: true,
        scopes: ["projects:read", "projects:create"],
      });
      m(prisma.apiClient.update).mockResolvedValue({});

      const req = new NextRequest("http://localhost:3000/api/partner/projects", {
        headers: { "X-Api-Key": rawKey },
      });

      const client = await getAuthClient(req, "projects:read");
      expect(client.id).toBe("c-valid");
    });
  });

  describe("4. Multi-Tenant Cross-Company Isolation (IDOR/BOLA Protection)", () => {
    it("returns 404 NotFoundError when API key from Org A tries to access project belonging to Org B", async () => {
      // Project exists, but belongs to Org B
      m(prisma.project.findUnique).mockResolvedValue({
        id: "proj-org-b",
        organizationId: "org-b",
        externalRef: "external-proj-belonging-to-org-b",
      });

      await expect(
        getPartnerProject("external-proj-belonging-to-org-b", "org-a")
      ).rejects.toThrow(NotFoundError);
      await expect(
        getPartnerProject("external-proj-belonging-to-org-b", "org-a")
      ).rejects.toThrow("Project not found");
    });

    it("returns the project when the API key's organizationId matches the project's organizationId", async () => {
      m(prisma.project.findUnique).mockResolvedValue({
        id: "proj-123",
        name: "Org A Project",
        externalRef: "org-a-proj-1",
        organizationId: "org-a",
      });

      const project = await getPartnerProject("org-a-proj-1", "org-a");
      expect(project.id).toBe("proj-123");
      expect(project.organizationId).toBe("org-a");
    });
  });

  describe("5. Enterprise API Key Management Endpoints (/api/integrations/api-keys)", () => {
    it("POST /api/integrations/api-keys generates a key and returns the full secret only once", async () => {
      const { POST } = await import("../app/api/integrations/api-keys/route");
      const clientAuth = {
        id: "admin-client",
        organizationId: "org-acme",
        scopes: ["integrations:manage"],
      };
      m(prisma.apiClient.findFirst).mockResolvedValue(clientAuth);
      m(prisma.apiClient.create).mockImplementation(async ({ data }: any) => ({
        id: "new-key-id",
        ...data,
        createdAt: new Date(),
      }));

      const req = new NextRequest("http://localhost:3000/api/integrations/api-keys", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Api-Key": "sz_live_admin_key",
        },
        body: JSON.stringify({
          name: "CI/CD Integration Key",
          scopes: ["projects:read", "analysis:run"],
          expiresInDays: 90,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.apiKey).toMatch(/^sz_live_/);
      expect(body.data.keyPrefix).toBe(body.data.apiKey.slice(0, 12));
      expect(body.data.scopes).toEqual(["projects:read", "analysis:run"]);
    });

    it("GET /api/integrations/api-keys lists keys with masked prefix and never exposes plain secrets", async () => {
      const { GET } = await import("../app/api/integrations/api-keys/route");
      const clientAuth = {
        id: "admin-client",
        organizationId: "org-acme",
        scopes: ["integrations:manage"],
      };
      m(prisma.apiClient.findFirst).mockResolvedValue(clientAuth);
      m(prisma.apiClient.findMany).mockResolvedValue([
        {
          id: "k-1",
          name: "CI Key",
          keyPrefix: "sz_live_abcd",
          organizationId: "org-acme",
          scopes: ["projects:read"],
          active: true,
          createdAt: new Date(),
        },
      ]);

      const req = new NextRequest("http://localhost:3000/api/integrations/api-keys", {
        headers: { "X-Api-Key": "sz_live_admin_key" },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].keyPrefix).toBe("sz_live_abcd");
      expect(body.data[0].apiKey).toBeUndefined();
      expect(body.data[0].rawKey).toBeUndefined();
      expect(body.data[0].keyHash).toBeUndefined();
    });

    it("POST /api/integrations/api-keys/[id] with action 'revoke' revokes the key", async () => {
      const { POST } = await import("../app/api/integrations/api-keys/[id]/route");
      const clientAuth = {
        id: "admin-client",
        organizationId: "org-acme",
        scopes: ["integrations:manage"],
      };
      m(prisma.apiClient.findFirst).mockResolvedValue(clientAuth);
      m(prisma.apiClient.findUnique).mockResolvedValue({ id: "target-key", name: "Target Key" });
      m(prisma.apiClient.update).mockResolvedValue({
        id: "target-key",
        active: false,
        revokedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/integrations/api-keys/target-key", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Api-Key": "sz_live_admin_key",
        },
        body: JSON.stringify({ action: "revoke" }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "target-key" }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.revoked).toBe(true);
    });

    it("POST /api/integrations/api-keys/[id] with action 'rotate' regenerates secret", async () => {
      const { POST } = await import("../app/api/integrations/api-keys/[id]/route");
      const clientAuth = {
        id: "admin-client",
        organizationId: "org-acme",
        scopes: ["integrations:manage"],
      };
      m(prisma.apiClient.findFirst).mockResolvedValue(clientAuth);
      m(prisma.apiClient.findUnique).mockResolvedValue({ id: "target-key", name: "Target Key" });
      m(prisma.apiClient.update).mockImplementation(async ({ data }: any) => ({
        id: "target-key",
        ...data,
      }));

      const req = new NextRequest("http://localhost:3000/api/integrations/api-keys/target-key", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Api-Key": "sz_live_admin_key",
        },
        body: JSON.stringify({ action: "rotate" }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "target-key" }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.apiKey).toMatch(/^sz_live_/);
      expect(body.data.keyPrefix).toBe(body.data.apiKey.slice(0, 12));
    });
  });
});
