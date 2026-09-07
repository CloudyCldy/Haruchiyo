import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { created, handleError } from "@/lib/http";
import { parse, registerSchema } from "@/validators/schemas";
import { publicUser, signToken } from "@/lib/auth";
export async function POST(request: NextRequest) { try { const input = parse(registerSchema, await request.json()); const password = await bcrypt.hash(input.password, 12); const user = await prisma.user.create({ data: { ...input, password } }); return created({ user: publicUser(user), token: await signToken(user.id) }); } catch (error) { return handleError(error); } }
