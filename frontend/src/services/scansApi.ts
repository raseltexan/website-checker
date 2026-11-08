import { api, cleanParams, unwrap, unwrapList } from "./api";
import type { ApiResponse, ListParams } from "@/types/api";
import type { CheckerCategory, Scan } from "@/types/models";

export interface CreateScanInput {
  url: string;
  checks?: string[];
  websiteId?: string;
}

export const scansApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCheckers: build.query<CheckerCategory[], void>({
      query: () => "/checkers",
      transformResponse: unwrap<CheckerCategory[]>,
      providesTags: ["Checker"],
    }),
    getScans: build.query({
      query: (params?: ListParams) => ({ url: "/scans", params: cleanParams(params) }),
      transformResponse: (r: ApiResponse<Scan[]>) => unwrapList(r),
      providesTags: ["Scan"],
    }),
    getScan: build.query<Scan, string>({
      query: (id) => `/scans/${id}`,
      transformResponse: unwrap<Scan>,
      providesTags: (_r, _e, id) => [{ type: "Scan", id }],
    }),
    createScan: build.mutation<Scan, CreateScanInput>({
      query: (body) => ({ url: "/scans", method: "POST", body }),
      transformResponse: unwrap<Scan>,
      invalidatesTags: ["Scan", "Dashboard", "Profile", "Website"],
    }),
    cancelScan: build.mutation<Scan, string>({
      query: (id) => ({ url: `/scans/${id}/cancel`, method: "POST" }),
      transformResponse: unwrap<Scan>,
      invalidatesTags: (_r, _e, id) => ["Scan", { type: "Scan", id }, "Dashboard"],
    }),
    rescan: build.mutation<Scan, string>({
      query: (id) => ({ url: `/scans/${id}/rescan`, method: "POST" }),
      transformResponse: unwrap<Scan>,
      invalidatesTags: ["Scan", "Dashboard", "Profile"],
    }),
    deleteScan: build.mutation<void, string>({
      query: (id) => ({ url: `/scans/${id}`, method: "DELETE" }),
      invalidatesTags: ["Scan", "Dashboard", "Report"],
    }),
  }),
});

export const {
  useGetCheckersQuery,
  useGetScansQuery,
  useGetScanQuery,
  useCreateScanMutation,
  useCancelScanMutation,
  useRescanMutation,
  useDeleteScanMutation,
} = scansApi;
