import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/route";
import { ok } from "@/lib/http";
export async function GET(request: NextRequest) { return withAuth(request, async user => ok(await prisma.chatConversation.findMany({ where: { userId: user.id }, include: { project: { select: { id: true, name: true } }, messages: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" } }))); }
