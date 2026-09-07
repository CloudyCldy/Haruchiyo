import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { MethodologyService } from "@/methodology/service";
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { return ok(MethodologyService.metrics((await params).id)); }
