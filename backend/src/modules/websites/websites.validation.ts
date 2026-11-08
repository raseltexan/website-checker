import { z } from "zod";
import { listQuerySchema } from "../../utils/query.js";

export const createWebsiteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  url: z.string().trim().min(3).max(2048),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
});

export const updateWebsiteSchema = createWebsiteSchema.partial();

export const websiteListQuery = listQuerySchema.extend({ tag: z.string().max(30).optional() });

export type WebsiteListQuery = z.infer<typeof websiteListQuery>;
