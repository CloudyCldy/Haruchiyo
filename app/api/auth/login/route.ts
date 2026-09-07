import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { fail, handleError, ok } from "@/lib/http";
import { parse, loginSchema } from "@/validators/schemas";
import { publicUser, signToken } from "@/lib/auth";
export async function POST(request: NextRequest) { try { const input = parse(loginSchema, await request.json()); const user = await prisma.user.findUnique({ where: { email: input.email } }); if (!user || !(await bcrypt.compare(input.password, user.password))) return fail("INVALID_CREDENTIALS", "Invalid email or password", 401); return ok({ user: publicUser(user), token: await signToken(user.id) }, "Logged in successfully"); } catch (error) { return handleError(error); } }
