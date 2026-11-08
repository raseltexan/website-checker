import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface UiState {
  sidebarOpen: boolean;
  toasts: Toast[];
}

const initialState: UiState = { sidebarOpen: false, toasts: [] };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    pushToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.toasts = [...state.toasts.slice(-3), action.payload];
      },
      prepare: (tone: ToastTone, message: string) => ({ payload: { id: nanoid(), tone, message } }),
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { setSidebarOpen, pushToast, dismissToast } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
