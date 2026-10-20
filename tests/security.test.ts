import { NextRequest } from "next/server";
import { handleError } from "@/lib/http";
import { RateLimitError } from "@/lib/errors";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limit";
import { registerSchema, loginSchema, parse } from "@/validators/schemas";

describe("Security Hardening & Rate Limiting", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe("Rate Limiter", () => {
    it("allows requests under the configured threshold", () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      });

      const res1 = checkRateLimit(req, { keyPrefix: "test", max: 3, windowMs: 10_000 });
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit(req, { keyPrefix: "test", max: 3, windowMs: 10_000 });
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit(req, { keyPrefix: "test", max: 3, windowMs: 10_000 });
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it("blocks requests that exceed the limit and returns retryAfter", () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        headers: { "x-forwarded-for": "192.168.1.101" },
      });

      for (let i = 0; i < 3; i++) {
        checkRateLimit(req, { keyPrefix: "test-block", max: 3, windowMs: 10_000 });
      }

      const blocked = checkRateLimit(req, { keyPrefix: "test-block", max: 3, windowMs: 10_000 });
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfter).toBeGreaterThan(0);
    });

    it("isolates different client IPs", () => {
      const reqA = new NextRequest("http://localhost:3000/api/auth/login", {
        headers: { "x-forwarded-for": "10.0.0.1" },
      });
      const reqB = new NextRequest("http://localhost:3000/api/auth/login", {
        headers: { "x-forwarded-for": "10.0.0.2" },
      });

      for (let i = 0; i < 2; i++) {
        checkRateLimit(reqA, { keyPrefix: "test-ip", max: 2, windowMs: 10_000 });
      }

      const blockedA = checkRateLimit(reqA, { keyPrefix: "test-ip", max: 2, windowMs: 10_000 });
      expect(blockedA.success).toBe(false);

      const allowedB = checkRateLimit(reqB, { keyPrefix: "test-ip", max: 2, windowMs: 10_000 });
      expect(allowedB.success).toBe(true);
    });
  });

  describe("HTTP Error Handler & 429 Responses", () => {
    it("handles RateLimitError with status 429 and Retry-After header", async () => {
      const err = new RateLimitError("Demasiadas peticiones", 45);
      const res = handleError(err);

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("45");
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("TOO_MANY_REQUESTS");
      expect(json.error.message).toContain("Demasiadas peticiones");
    });
  });

  describe("Input Validation & Bounds Security", () => {
    it("normalizes and trims email in login and register", () => {
      const reg = parse(registerSchema, {
        name: "  Operador Táctico  ",
        email: "  USER@SANZU.IO  ",
        password: "super-secure-password",
      });
      expect(reg.name).toBe("Operador Táctico");
      expect(reg.email).toBe("user@sanzu.io");

      const log = parse(loginSchema, {
        email: "  HAITANI@OPS.DEV ",
        password: "password123",
      });
      expect(log.email).toBe("haitani@ops.dev");
    });

    it("rejects excessively long passwords to prevent ReDoS / bcrypt exhaustion attacks", () => {
      const hugePassword = "A".repeat(200);
      expect(() => {
        parse(registerSchema, {
          name: "Test",
          email: "test@example.com",
          password: hugePassword,
        });
      }).toThrow();
    });
  });
});
