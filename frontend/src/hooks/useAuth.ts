import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useGetSessionQuery, useSignOutMutation } from "@/services/authApi";
import { useAppDispatch } from "@/redux/hooks";

export function useAuth() {
  const { data, isLoading, isFetching, isError } = useGetSessionQuery();
  const user = data?.user ?? null;
  return {
    user,
    session: data?.session ?? null,
    isLoading: isLoading || (isFetching && !data),
    isError,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
  };
}

export function useLogout() {
  const [signOut, { isLoading }] = useSignOutMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const logout = useCallback(async () => {
    await signOut().catch(() => undefined);
    dispatch(api.util.resetApiState());
    router.replace("/login");
  }, [signOut, dispatch, router]);
  return { logout, isLoading };
}
