import type { Response } from "express";
import type { PaginationMeta } from "./query.js";

interface ResponsePayload<T> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

/** Standard success envelope: `{ success, message, data, meta? }`. */
export const sendResponse = <T>(res: Response, { statusCode = 200, message = "Success", data, meta }: ResponsePayload<T>) => {
  res.status(statusCode).json({ success: true, message, data: data ?? null, ...(meta ? { meta } : {}) });
};
