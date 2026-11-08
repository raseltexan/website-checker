import { api, unwrap } from "./api";
import type { Plan, Subscription, Usage } from "@/types/models";

export interface BillingInfo {
  subscription: Subscription | null;
  plan: Plan | null;
  usage: Usage;
  paymentsEnabled: boolean;
}

export const billingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPlans: build.query<Plan[], void>({
      query: () => "/plans",
      transformResponse: unwrap<Plan[]>,
      providesTags: ["Plan"],
    }),
    getBilling: build.query<BillingInfo, void>({
      query: () => "/billing/subscription",
      transformResponse: unwrap<BillingInfo>,
      providesTags: ["Subscription"],
    }),
    changePlan: build.mutation<{ subscription?: Subscription; checkoutUrl?: string }, { planId: string; interval: "monthly" | "yearly" }>({
      query: (body) => ({ url: "/billing/change-plan", method: "POST", body }),
      transformResponse: unwrap<{ subscription?: Subscription; checkoutUrl?: string }>,
      invalidatesTags: ["Subscription", "Profile", "Dashboard"],
    }),
    cancelSubscription: build.mutation<Subscription, void>({
      query: () => ({ url: "/billing/cancel", method: "POST" }),
      transformResponse: unwrap<Subscription>,
      invalidatesTags: ["Subscription"],
    }),
    resumeSubscription: build.mutation<Subscription, void>({
      query: () => ({ url: "/billing/resume", method: "POST" }),
      transformResponse: unwrap<Subscription>,
      invalidatesTags: ["Subscription"],
    }),
  }),
});

export const { useGetPlansQuery, useGetBillingQuery, useChangePlanMutation, useCancelSubscriptionMutation, useResumeSubscriptionMutation } = billingApi;
