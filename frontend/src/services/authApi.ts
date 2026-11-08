import { api } from "./api";
import type { AuthSession } from "@/types/models";

interface SignInBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}
interface SignUpBody {
  name: string;
  email: string;
  password: string;
}

/** Better Auth endpoints (mounted at /api/auth on the backend). */
export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSession: build.query<AuthSession | null, void>({
      query: () => "/auth/get-session",
      providesTags: ["Session"],
    }),
    signIn: build.mutation<unknown, SignInBody>({
      query: (body) => ({ url: "/auth/sign-in/email", method: "POST", body }),
      invalidatesTags: ["Session", "Profile"],
    }),
    signUp: build.mutation<unknown, SignUpBody>({
      query: (body) => ({ url: "/auth/sign-up/email", method: "POST", body }),
      invalidatesTags: ["Session", "Profile"],
    }),
    signOut: build.mutation<unknown, void>({
      query: () => ({ url: "/auth/sign-out", method: "POST", body: {} }),
    }),
    requestPasswordReset: build.mutation<unknown, { email: string }>({
      query: (body) => ({ url: "/auth/request-password-reset", method: "POST", body }),
    }),
    resetPassword: build.mutation<unknown, { token: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
    changePassword: build.mutation<unknown, { currentPassword: string; newPassword: string; revokeOtherSessions?: boolean }>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
      invalidatesTags: ["Sessions"],
    }),
  }),
});

export const {
  useGetSessionQuery,
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
