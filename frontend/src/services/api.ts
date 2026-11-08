import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ApiResponse, ListParams, Paginated } from "@/types/api";

/**
 * Single RTK Query API. Feature endpoints are injected from `services/*Api.ts`.
 * Requests go to `/api`, which Next.js rewrites to the backend, keeping the
 * Better Auth session cookie first-party and httpOnly.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: [
    "Session",
    "Profile",
    "Dashboard",
    "Sessions",
    "Website",
    "Scan",
    "Report",
    "Checker",
    "Plan",
    "Subscription",
    "Notification",
    "Activity",
    "AdminUser",
    "AdminOverview",
    "Settings",
    "EmailLog",
    "Security",
  ],
  endpoints: () => ({}),
});

export const unwrap = <T>(response: ApiResponse<T>) => response.data;
export const unwrapList = <T>(response: ApiResponse<T[]>): Paginated<T> => ({
  data: response.data,
  meta: response.meta ?? { page: 1, limit: response.data.length, total: response.data.length, totalPages: 1 },
});

/** Drops empty values so they are not sent as query params. */
export const cleanParams = (params?: ListParams) =>
  Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "" && v !== null));
