import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

type QueryError = FetchBaseQueryError | SerializedError | undefined | unknown;

/** Extracts a human-readable message from RTK Query / backend / Better Auth errors. */
export const getErrorMessage = (error: QueryError, fallback = "Something went wrong. Please try again.") => {
  if (!error || typeof error !== "object") return fallback;
  if ("status" in error) {
    const data = (error as FetchBaseQueryError & { data?: { message?: string } }).data;
    if (data?.message) return data.message;
    if (error.status === "FETCH_ERROR") return "Unable to reach the server. Check your connection.";
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    if (error.status === 403) return "You do not have permission to do that.";
    return fallback;
  }
  return "message" in error && typeof error.message === "string" ? error.message : fallback;
};

export const getErrorStatus = (error: QueryError) =>
  error && typeof error === "object" && "status" in error ? (error as FetchBaseQueryError).status : undefined;
