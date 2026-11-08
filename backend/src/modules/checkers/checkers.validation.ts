import { z } from "zod";

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(300).optional(),
  order: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

export const updateCheckSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  weight: z.number().int().min(1).max(10).optional(),
  order: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});
