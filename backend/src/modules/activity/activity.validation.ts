import { z } from "zod";
import { listQuerySchema } from "../../utils/query.js";

export const activityListQuery = listQuerySchema.extend({
  level: z.enum(["INFO", "WARNING", "SECURITY"]).optional(),
  action: z.string().max(80).optional(),
  userId: z.string().max(64).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ActivityListQuery = z.infer<typeof activityListQuery>;
