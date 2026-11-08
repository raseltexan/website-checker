import type { LogLevel, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export interface ActivityInput {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  level?: LogLevel;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

/** Audit log writer. Never throws — logging must not break a request. */
export const logActivity = async (input: ActivityInput) => {
  try {
    await prisma.activityLog.create({ data: { ...input, userId: input.userId ?? null } });
  } catch (error) {
    console.error("Failed to write activity log", error);
  }
};
