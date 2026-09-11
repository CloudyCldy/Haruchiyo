import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const key = randomBytes(32).toString("base64url");
  const keyHash = createHash("sha256").update(key).digest("hex");
  const existing = await prisma.apiClient.findFirst({ where: { name: "Haitani" } });
  if (existing) {
    await prisma.apiClient.update({ where: { id: existing.id }, data: { keyHash, active: true } });
  } else {
    await prisma.apiClient.create({ data: { name: "Haitani", keyHash } });
  }
  console.log(`SANZU_API_KEY=${key}`);
}

main().finally(() => prisma.$disconnect());