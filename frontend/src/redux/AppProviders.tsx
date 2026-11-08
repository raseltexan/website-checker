import { Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/Toaster";
import { StoreProvider } from "./StoreProvider";

/**
 * Client state for interactive route groups. Creating a Redux store uses random ids,
 * which Cache Components forbids during static prerender, so the provider renders
 * behind a Suspense boundary: the surrounding layout stays static and the
 * interactive part is rendered per request.
 */
export function AppProviders({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <StoreProvider>
        {children}
        <Toaster />
      </StoreProvider>
    </Suspense>
  );
}
