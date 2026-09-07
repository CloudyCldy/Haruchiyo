import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicUser } from "@/lib/auth";
import { withAuth } from "@/lib/route";
import { handleError, ok } from "@/lib/http";
import { z } from "zod";
export async function GET(request: NextRequest) { return withAuth(request, async user => ok(publicUser(user))); }
export async function PUT(request: NextRequest) { return withAuth(request, async user => { try { const input = z.object({ name: z.string().min(2).optional(), email: z.string().email().optional() }).parse(await request.json()); return ok(publicUser(await prisma.user.update({ where: { id: user.id }, data: input }))); } catch (error) { return handleError(error); } }); }
