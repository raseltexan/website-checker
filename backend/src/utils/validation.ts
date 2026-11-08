import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
export const idParam = z.object({ id: objectId });
/** Better Auth ids are not ObjectIds, so user ids only need to be non-empty. */
export const userIdParam = z.object({ id: z.string().min(1).max(64) });
