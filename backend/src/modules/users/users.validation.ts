import { z } from "zod";
import { listQuerySchema } from "../../utils/query.js";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  company: z.string().trim().max(100).optional(),
  timezone: z.string().trim().max(60).optional(),
  image: z.url().max(500).or(z.literal("")).optional(),
});

export const sessionIdParam = z.object({ sessionId: z.string().min(1).max(64) });

export const userListQuery = listQuerySchema.extend({
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(["user", "admin"]).optional(),
  emailVerified: z.boolean().optional(),
});

export const banUserSchema = z.object({
  reason: z.string().trim().max(300).optional(),
  expiresInDays: z.number().int().min(1).max(3650).optional(),
});

export type UserListQuery = z.infer<typeof userListQuery>;
