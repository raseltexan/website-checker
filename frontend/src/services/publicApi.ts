import { api, unwrap } from "./api";
import type { PublicStats } from "@/types/models";

/** Unauthenticated endpoints used by the marketing pages. */
export const publicApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPublicStats: build.query<PublicStats, void>({
      query: () => "/public/checkers/stats",
      transformResponse: unwrap<PublicStats>,
      providesTags: ["Checker"],
    }),
  }),
});

export const { useGetPublicStatsQuery } = publicApi;
