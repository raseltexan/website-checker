import { z } from "zod";
import { listQuerySchema } from "../../utils/query.js";

export const emailLogQuery = listQuerySchema.extend({
  status: z.enum(["SENT", "FAILED", "SKIPPED"]).optional(),
});

export const testEmailSchema = z.object({ to: z.email() });

export const sessionIdParam = z.object({ id: z.string().min(1).max(64) });

export type EmailLogQuery = z.infer<typeof emailLogQuery>;
