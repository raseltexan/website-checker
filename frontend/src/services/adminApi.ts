import { api, cleanParams, unwrap, unwrapList } from "./api";
import type { ApiResponse, ListParams } from "@/types/api";
import type {
  ActivityLog,
  AppSettings,
  CheckerCategory,
  Check,
  EmailLog,
  Notification,
  NotificationType,
  Plan,
  Report,
  ReportDetail,
  Role,
  Scan,
  Subscription,
  User,
  Website,
} from "@/types/models";
import type { AdminOverview, AdminUserDetail, AdminUserRow, BrowserTestingData, EmailOverview, PlanInput, ScanQueueStats, SecurityOverview, SystemHealth } from "@/types/admin";

const list = <T>() => (r: ApiResponse<T[]>) => unwrapList(r);

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Overview & system
    getAdminOverview: build.query<AdminOverview, void>({ query: () => "/admin/overview", transformResponse: unwrap<AdminOverview>, providesTags: ["AdminOverview"] }),
    getSystemHealth: build.query<SystemHealth, void>({ query: () => "/admin/system-health", transformResponse: unwrap<SystemHealth> }),
    getSecurityOverview: build.query<SecurityOverview, void>({ query: () => "/admin/security", transformResponse: unwrap<SecurityOverview>, providesTags: ["Security"] }),
    revokeAnySession: build.mutation<void, string>({ query: (id) => ({ url: `/admin/security/sessions/${id}`, method: "DELETE" }), invalidatesTags: ["Security"] }),

    // Users
    getAdminUsers: build.query({ query: (p?: ListParams) => ({ url: "/admin/users", params: cleanParams(p) }), transformResponse: list<AdminUserRow>(), providesTags: ["AdminUser"] }),
    getAdminUser: build.query<AdminUserDetail, string>({ query: (id) => `/admin/users/${id}`, transformResponse: unwrap<AdminUserDetail>, providesTags: ["AdminUser"] }),
    updateAdminUser: build.mutation<User, { id: string; name?: string; role?: Role; emailVerified?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}`, method: "PATCH", body }),
      invalidatesTags: ["AdminUser"],
    }),
    banUser: build.mutation<User, { id: string; reason?: string; expiresInDays?: number }>({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}/ban`, method: "POST", body }),
      invalidatesTags: ["AdminUser", "Security"],
    }),
    unbanUser: build.mutation<User, string>({ query: (id) => ({ url: `/admin/users/${id}/unban`, method: "POST" }), invalidatesTags: ["AdminUser", "Security"] }),
    revokeUserSessions: build.mutation<void, string>({ query: (id) => ({ url: `/admin/users/${id}/revoke-sessions`, method: "POST" }), invalidatesTags: ["AdminUser", "Security"] }),
    deleteUser: build.mutation<void, string>({ query: (id) => ({ url: `/admin/users/${id}`, method: "DELETE" }), invalidatesTags: ["AdminUser", "AdminOverview"] }),
    assignPlan: build.mutation<Subscription, { userId: string; planId: string; interval: "monthly" | "yearly" }>({
      query: ({ userId, ...body }) => ({ url: `/admin/subscriptions/users/${userId}`, method: "PATCH", body }),
      invalidatesTags: ["AdminUser", "Subscription"],
    }),

    // Websites / scans / reports
    getAdminWebsites: build.query({ query: (p?: ListParams) => ({ url: "/admin/websites", params: cleanParams(p) }), transformResponse: list<Website>(), providesTags: ["Website"] }),
    deleteAdminWebsite: build.mutation<void, string>({ query: (id) => ({ url: `/admin/websites/${id}`, method: "DELETE" }), invalidatesTags: ["Website"] }),
    getAdminScans: build.query({ query: (p?: ListParams) => ({ url: "/admin/scans", params: cleanParams(p) }), transformResponse: list<Scan>(), providesTags: ["Scan"] }),
    getAdminScan: build.query<Scan, string>({ query: (id) => `/admin/scans/${id}`, transformResponse: unwrap<Scan>, providesTags: ["Scan"] }),
    getScanQueueStats: build.query<ScanQueueStats, void>({ query: () => "/admin/scans/stats", transformResponse: unwrap<ScanQueueStats>, providesTags: ["Scan"] }),
    cancelAdminScan: build.mutation<void, string>({ query: (id) => ({ url: `/admin/scans/${id}/cancel`, method: "POST" }), invalidatesTags: ["Scan"] }),
    deleteAdminScan: build.mutation<void, string>({ query: (id) => ({ url: `/admin/scans/${id}`, method: "DELETE" }), invalidatesTags: ["Scan"] }),
    getAdminReports: build.query({ query: (p?: ListParams) => ({ url: "/admin/reports", params: cleanParams(p) }), transformResponse: list<Report>(), providesTags: ["Report"] }),
    getAdminReport: build.query<ReportDetail, string>({ query: (id) => `/admin/reports/${id}`, transformResponse: unwrap<ReportDetail>, providesTags: ["Report"] }),
    deleteAdminReport: build.mutation<void, string>({ query: (id) => ({ url: `/admin/reports/${id}`, method: "DELETE" }), invalidatesTags: ["Report"] }),

    // Checker catalog
    getAdminCheckers: build.query<CheckerCategory[], void>({ query: () => "/admin/checkers", transformResponse: unwrap<CheckerCategory[]>, providesTags: ["Checker"] }),
    updateCategory: build.mutation<CheckerCategory, { id: string } & Partial<Pick<CheckerCategory, "name" | "description" | "order" | "isEnabled">>>({
      query: ({ id, ...body }) => ({ url: `/admin/checkers/categories/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Checker"],
    }),
    updateCheck: build.mutation<Check, { id: string } & Partial<Pick<Check, "name" | "description" | "severity" | "weight" | "order" | "isEnabled">>>({
      query: ({ id, ...body }) => ({ url: `/admin/checkers/checks/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Checker"],
    }),

    // Plans & subscriptions
    getAdminPlans: build.query<Plan[], void>({ query: () => "/admin/plans", transformResponse: unwrap<Plan[]>, providesTags: ["Plan"] }),
    createPlan: build.mutation<Plan, PlanInput>({ query: (body) => ({ url: "/admin/plans", method: "POST", body }), invalidatesTags: ["Plan"] }),
    updatePlan: build.mutation<Plan, { id: string } & Partial<PlanInput>>({ query: ({ id, ...body }) => ({ url: `/admin/plans/${id}`, method: "PATCH", body }), invalidatesTags: ["Plan"] }),
    deletePlan: build.mutation<void, string>({ query: (id) => ({ url: `/admin/plans/${id}`, method: "DELETE" }), invalidatesTags: ["Plan"] }),
    getAdminSubscriptions: build.query({ query: (p?: ListParams) => ({ url: "/admin/subscriptions", params: cleanParams(p) }), transformResponse: list<Subscription>(), providesTags: ["Subscription"] }),

    // Notifications
    getAdminNotifications: build.query({ query: (p?: ListParams) => ({ url: "/admin/notifications", params: cleanParams(p) }), transformResponse: list<Notification>(), providesTags: ["Notification"] }),
    broadcastNotification: build.mutation<{ sent: number }, { title: string; message: string; type: NotificationType; link?: string; userIds?: string[] }>({
      query: (body) => ({ url: "/admin/notifications/broadcast", method: "POST", body }),
      transformResponse: unwrap<{ sent: number }>,
      invalidatesTags: ["Notification"],
    }),

    // Logs, email, settings
    getActivityLogs: build.query({ query: (p?: ListParams) => ({ url: "/admin/activity-logs", params: cleanParams(p) }), transformResponse: list<ActivityLog>(), providesTags: ["Activity"] }),
    getEmailOverview: build.query<EmailOverview, void>({ query: () => "/admin/email", transformResponse: unwrap<EmailOverview>, providesTags: ["EmailLog"] }),
    getEmailLogs: build.query({ query: (p?: ListParams) => ({ url: "/admin/email/logs", params: cleanParams(p) }), transformResponse: list<EmailLog>(), providesTags: ["EmailLog"] }),
    sendTestEmail: build.mutation<{ sent: boolean }, { to: string }>({
      query: (body) => ({ url: "/admin/email/test", method: "POST", body }),
      transformResponse: unwrap<{ sent: boolean }>,
      invalidatesTags: ["EmailLog"],
    }),
    getBrowserTesting: build.query<BrowserTestingData, void>({ query: () => "/admin/browser-testing", transformResponse: unwrap<BrowserTestingData>, providesTags: ["Settings"] }),
    getSettings: build.query<AppSettings, void>({ query: () => "/admin/settings", transformResponse: unwrap<AppSettings>, providesTags: ["Settings"] }),
    updateSettings: build.mutation<unknown, { key: keyof AppSettings; value: Partial<AppSettings[keyof AppSettings]> }>({
      query: ({ key, value }) => ({ url: `/admin/settings/${key}`, method: "PATCH", body: value }),
      invalidatesTags: ["Settings", "Checker"],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useGetSystemHealthQuery,
  useGetSecurityOverviewQuery,
  useRevokeAnySessionMutation,
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useUpdateAdminUserMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useRevokeUserSessionsMutation,
  useDeleteUserMutation,
  useAssignPlanMutation,
  useGetAdminWebsitesQuery,
  useDeleteAdminWebsiteMutation,
  useGetAdminScansQuery,
  useGetAdminScanQuery,
  useGetScanQueueStatsQuery,
  useCancelAdminScanMutation,
  useDeleteAdminScanMutation,
  useGetAdminReportsQuery,
  useGetAdminReportQuery,
  useDeleteAdminReportMutation,
  useGetAdminCheckersQuery,
  useUpdateCategoryMutation,
  useUpdateCheckMutation,
  useGetAdminPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useGetAdminSubscriptionsQuery,
  useGetAdminNotificationsQuery,
  useBroadcastNotificationMutation,
  useGetActivityLogsQuery,
  useGetEmailOverviewQuery,
  useGetEmailLogsQuery,
  useSendTestEmailMutation,
  useGetBrowserTestingQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = adminApi;
