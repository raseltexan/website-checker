import { api, cleanParams, unwrap, unwrapList } from "./api";
import type { ApiResponse, ListParams } from "@/types/api";
import type { ActivityLog, DashboardData, Profile, User, UserSessionInfo } from "@/types/models";

export interface ProfileInput {
  name?: string;
  company?: string;
  timezone?: string;
  image?: string;
}

export const userApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query<Profile, void>({
      query: () => "/users/me",
      transformResponse: unwrap<Profile>,
      providesTags: ["Profile"],
    }),
    updateProfile: build.mutation<User, ProfileInput>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      transformResponse: unwrap<User>,
      invalidatesTags: ["Profile", "Session"],
    }),
    deleteAccount: build.mutation<void, void>({
      query: () => ({ url: "/users/me", method: "DELETE" }),
    }),
    getDashboard: build.query<DashboardData, void>({
      query: () => "/users/me/dashboard",
      transformResponse: unwrap<DashboardData>,
      providesTags: ["Dashboard"],
    }),
    getMySessions: build.query<UserSessionInfo[], void>({
      query: () => "/users/me/sessions",
      transformResponse: unwrap<UserSessionInfo[]>,
      providesTags: ["Sessions"],
    }),
    revokeMySession: build.mutation<void, string>({
      query: (id) => ({ url: `/users/me/sessions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Sessions"],
    }),
    getMyActivity: build.query({
      query: (params?: ListParams) => ({ url: "/activity", params: cleanParams(params) }),
      transformResponse: (r: ApiResponse<ActivityLog[]>) => unwrapList(r),
      providesTags: ["Activity"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteAccountMutation,
  useGetDashboardQuery,
  useGetMySessionsQuery,
  useRevokeMySessionMutation,
  useGetMyActivityQuery,
} = userApi;
