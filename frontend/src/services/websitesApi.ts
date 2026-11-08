import { api, cleanParams, unwrap, unwrapList } from "./api";
import type { ApiResponse, ListParams } from "@/types/api";
import type { Website } from "@/types/models";

export interface WebsiteInput {
  name: string;
  url: string;
  tags: string[];
}

export const websitesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getWebsites: build.query({
      query: (params?: ListParams) => ({ url: "/websites", params: cleanParams(params) }),
      transformResponse: (r: ApiResponse<Website[]>) => unwrapList(r),
      providesTags: ["Website"],
    }),
    getWebsite: build.query<Website, string>({
      query: (id) => `/websites/${id}`,
      transformResponse: unwrap<Website>,
      providesTags: (_r, _e, id) => [{ type: "Website", id }],
    }),
    createWebsite: build.mutation<Website, WebsiteInput>({
      query: (body) => ({ url: "/websites", method: "POST", body }),
      transformResponse: unwrap<Website>,
      invalidatesTags: ["Website", "Dashboard", "Profile"],
    }),
    updateWebsite: build.mutation<Website, { id: string } & Partial<WebsiteInput>>({
      query: ({ id, ...body }) => ({ url: `/websites/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<Website>,
      invalidatesTags: ["Website"],
    }),
    deleteWebsite: build.mutation<void, string>({
      query: (id) => ({ url: `/websites/${id}`, method: "DELETE" }),
      invalidatesTags: ["Website", "Dashboard", "Profile"],
    }),
  }),
});

export const { useGetWebsitesQuery, useGetWebsiteQuery, useCreateWebsiteMutation, useUpdateWebsiteMutation, useDeleteWebsiteMutation } = websitesApi;
