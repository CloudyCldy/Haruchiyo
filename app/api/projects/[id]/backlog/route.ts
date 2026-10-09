import { NextRequest } from "next/server";
import { withProject } from "@/lib/route";
import { created, ok } from "@/lib/http";
import { parse, backlogSchema, backlogFilterSchema } from "@/validators/schemas";
import { createBacklogItem, listBacklog } from "@/services/work.service";

type Params = { params: Promise<{ id: string }> };

/** GET ?type=BUG&status=READY&priority=HIGH&sprintId=<id>|none */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withProject(request, id, async () => {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = parse(backlogFilterSchema, query);
    return ok(await listBacklog(id, { ...filters, sprintId: filters.sprintId === "none" ? null : filters.sprintId }));
  });
}
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withProject(request, id, async () => created(await createBacklogItem(id, parse(backlogSchema, await request.json()))));
}