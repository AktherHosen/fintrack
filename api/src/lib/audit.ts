import type { Prisma } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "./prisma.js";

export async function writeAuditLog(params: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
      ipAddress: params.req?.ip ?? null,
      userAgent: params.req?.get("user-agent") ?? null,
    },
  });
}
