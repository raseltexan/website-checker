import { z } from "zod";
import { listQuerySchema } from "../../utils/query.js";
import { objectId } from "../../utils/validation.js";

export const createScanSchema = z.object({
  url: z.string().trim().min(3).max(2048),
  checks: z.array(z.string().max(80)).max(200).optional(),
  websiteId: objectId.optional(),
});

export const scanListQuery = listQuerySchema.extend({
  status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  websiteId: objectId.optional(),
});

export type ScanListQuery = z.infer<typeof scanListQuery>;
