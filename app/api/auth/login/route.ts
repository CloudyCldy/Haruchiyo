import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { fail, handleError, ok } from "@/lib/http";
import { parse, loginSchema } from "@/validators/schemas";
import { publicUser, signToken } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";

// Dummy hash for constant-time comparison to protect against user enumeration timing attacks
const DUMMY_HASH = "$2a$12$e8h.7yQfD3zG2Z0eG0e8h.7yQfD3zG2Z0eG0e8h.7yQfD3zG2Z0eG";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, { keyPrefix: "auth-login", max: 10, windowMs: 60_000 });
    const input = parse(loginSchema, await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const isPasswordValid = user
      ? await bcrypt.compare(input.password, user.password)
      : await bcrypt.compare(input.password, DUMMY_HASH);

    if (!user || !isPasswordValid) {
      return fail("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }
    return ok({ user: publicUser(user), token: await signToken(user.id) }, "Logged in successfully");
  } catch (error) {
    return handleError(error);
  }
}
