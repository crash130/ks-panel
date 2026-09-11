import { prisma } from "@/lib/db";

export async function audit(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      meta: input.meta as object | undefined,
      ip: input.ip ?? undefined,
    },
  });
}
