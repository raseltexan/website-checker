import { z } from "zod";
import { objectId } from "../../utils/validation.js";
import { listQuerySchema } from "../../utils/query.js";

export const changePlanSchema = z.object({
  planId: objectId,
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const subscriptionListQuery = listQuerySchema.extend({
  status: z.enum(["ACTIVE", "TRIALING", "PAST_DUE", "CANCELLED"]).optional(),
});

export type SubscriptionListQuery = z.infer<typeof subscriptionListQuery>;
