import { useMemo } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { pushToast } from "@/redux/slices/uiSlice";
import { getErrorMessage } from "@/utils/errors";

export function useToast() {
  const dispatch = useAppDispatch();
  return useMemo(
    () => ({
      success: (message: string) => dispatch(pushToast("success", message)),
      info: (message: string) => dispatch(pushToast("info", message)),
      error: (errorOrMessage: unknown) =>
        dispatch(pushToast("error", typeof errorOrMessage === "string" ? errorOrMessage : getErrorMessage(errorOrMessage))),
    }),
    [dispatch],
  );
}
