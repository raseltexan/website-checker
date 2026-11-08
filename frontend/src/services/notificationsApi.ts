import { api, cleanParams, unwrap, unwrapList } from "./api";
import type { ApiResponse, ListParams } from "@/types/api";
import type { Notification } from "@/types/models";

export const notificationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query({
      query: (params?: ListParams) => ({ url: "/notifications", params: cleanParams(params) }),
      transformResponse: (r: ApiResponse<Notification[]>) => unwrapList(r),
      providesTags: ["Notification"],
    }),
    getUnreadCount: build.query<number, void>({
      query: () => "/notifications/unread-count",
      transformResponse: (r: ApiResponse<{ count: number }>) => unwrap(r).count,
      providesTags: ["Notification"],
    }),
    markNotificationRead: build.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "POST" }),
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: build.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
