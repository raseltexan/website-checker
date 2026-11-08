import { z } from "zod";
import { listQuerySchema } from "../../utils/query.js";

export const notificationListQuery = listQuerySchema.extend({
  unread: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

export const broadcastSchema = z.object({
  title: z.string().trim().min(2).max(100),
  message: z.string().trim().min(2).max(1000),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]).default("INFO"),
  link: z.string().trim().max(300).optional(),
  /** Target specific users; omit to send to everyone. */
  userIds: z.array(z.string().min(1)).max(1000).optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuery>;
