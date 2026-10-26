import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { withAuthOrApiKey } from "@/lib/route";
import { KnowledgeService } from "@/knowledge/service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuthOrApiKey(req, "projects:read", async () => {
    const { id } = await params;
    const process = KnowledgeService.getProcess(id);
    if (!process) {
      return fail("PROCESS_NOT_FOUND", "Process definition not found", 404);
    }

    const { searchParams } = new URL(req.url);
    const phaseStep = searchParams.get("phase");

    if (phaseStep) {
      const stepNumber = parseInt(phaseStep, 10);
      const phase = process.phases.find(
        p => p.step === stepNumber || p.name.toLowerCase().includes(phaseStep.toLowerCase())
      );
      if (!phase) {
        return fail("PHASE_NOT_FOUND", `Phase "${phaseStep}" not found in process "${id}"`, 404);
      }
      return ok({
        processId: process.id,
        processName: process.name,
        ownerRole: process.ownerRole,
        version: process.version,
        phase
      });
    }

    return ok(process);
  });
}
