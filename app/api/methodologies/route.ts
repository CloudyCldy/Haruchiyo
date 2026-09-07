import { ok } from "@/lib/http";
import { MethodologyService } from "@/methodology/service";
export async function GET() { return ok(MethodologyService.list()); }
