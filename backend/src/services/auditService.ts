import { prisma } from '../lib/prisma.js';

export async function audit(params: {
  actorId?: string | null;
  targetUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      targetUserId: params.targetUserId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: (params.metadata as any) ?? undefined,
      ip: params.ip,
    },
  });
}
