import { z } from "zod";

export const createPlanSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug may contain lowercase letters, numbers and dashes").min(2).max(40),
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).default(""),
  priceMonthly: z.number().int().min(0),
  priceYearly: z.number().int().min(0),
  scanLimit: z.number().int().min(-1),
  websiteLimit: z.number().int().min(-1),
  features: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const updatePlanSchema = createPlanSchema.partial();
