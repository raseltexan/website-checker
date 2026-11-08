import { api, cleanParams, unwrap, unwrapList } from "./api";
import type { ApiResponse, ListParams } from "@/types/api";
import type { Report, ReportDetail } from "@/types/models";

export const reportsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReports: build.query({
      query: (params?: ListParams) => ({ url: "/reports", params: cleanParams(params) }),
      transformResponse: (r: ApiResponse<Report[]>) => unwrapList(r),
      providesTags: ["Report"],
    }),
    getReport: build.query<ReportDetail, string>({
      query: (id) => `/reports/${id}`,
      transformResponse: unwrap<ReportDetail>,
      providesTags: (_r, _e, id) => [{ type: "Report", id }],
    }),
    deleteReport: build.mutation<void, string>({
      query: (id) => ({ url: `/reports/${id}`, method: "DELETE" }),
      invalidatesTags: ["Report"],
    }),
  }),
});

export const { useGetReportsQuery, useGetReportQuery, useDeleteReportMutation } = reportsApi;
