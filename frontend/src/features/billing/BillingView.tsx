"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { UsageCard } from "@/features/dashboard/UsageCard";
import { useToast } from "@/hooks/useToast";
import { useCancelSubscriptionMutation, useChangePlanMutation, useGetBillingQuery, useGetPlansQuery, useResumeSubscriptionMutation } from "@/services/billingApi";
import type { Plan } from "@/types/models";
import { formatDate } from "@/utils/format";
import { PlanCard } from "./PlanCard";

export function BillingView() {
  const toast = useToast();
  const [interval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const billing = useGetBillingQuery();
  const plans = useGetPlansQuery();
  const [changePlan, changeState] = useChangePlanMutation();
  const [cancel, cancelState] = useCancelSubscriptionMutation();
  const [resume, resumeState] = useResumeSubscriptionMutation();
  const sub = billing.data?.subscription;

  const onSelect = async (plan: Plan) => {
    const res = await changePlan({ planId: plan.id, interval });
    if ("error" in res) return toast.error(res.error);
    if (res.data.checkoutUrl) window.location.assign(res.data.checkoutUrl);
    else toast.success(`You're now on the ${plan.name} plan`);
  };

  const onToggleCancel = async () => {
    const res = sub?.cancelAtPeriodEnd ? await resume() : await cancel();
    if ("error" in res) toast.error(res.error);
    else toast.success(sub?.cancelAtPeriodEnd ? "Subscription resumed" : "Subscription will end at the period end");
  };

  return (
    <>
      <PageHeader title="Subscription & Billing" description="Manage your plan and usage limits." />
      <QueryState isLoading={billing.isLoading} error={billing.error} onRetry={billing.refetch}>
        {billing.data && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Current plan" action={sub && <Badge tone={sub.cancelAtPeriodEnd ? "warning" : "success"}>{sub.cancelAtPeriodEnd ? "Cancels at period end" : sub.status.toLowerCase()}</Badge>} />
              <CardBody className="space-y-4">
                <div>
                  <p className="text-3xl font-extrabold">{billing.data.plan?.name ?? "No plan"}</p>
                  <p className="text-sm text-muted">
                    {sub ? `Billed ${sub.interval} · renews ${formatDate(sub.currentPeriodEnd)}` : "You are on the default plan."}
                  </p>
                </div>
                {sub && billing.data.plan && (billing.data.plan.priceMonthly > 0 || billing.data.plan.priceYearly > 0) && (
                  <Button variant="outline" loading={cancelState.isLoading || resumeState.isLoading} onClick={onToggleCancel}>
                    {sub.cancelAtPeriodEnd ? "Resume subscription" : "Cancel subscription"}
                  </Button>
                )}
              </CardBody>
            </Card>
            <UsageCard plan={billing.data.plan} usage={billing.data.usage} />
          </div>
        )}
      </QueryState>

      <div className="mt-8 mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">Available plans</h2>
        <Tabs value={interval} onChange={setBillingInterval} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly · save ~17%" }]} />
      </div>
      {billing.data && !billing.data.paymentsEnabled && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-600/30 bg-brand-50 px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>Online payments are not enabled yet. Free plans can be switched instantly; contact support to upgrade to a paid plan.</p>
        </div>
      )}
      <QueryState isLoading={plans.isLoading} error={plans.error} onRetry={plans.refetch}>
        <div className="grid grid-cols-1 gap-6 pt-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.data?.map((plan, i, all) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              interval={interval}
              current={billing.data?.plan?.id === plan.id}
              featured={all.length > 2 && i === 1}
              loading={changeState.isLoading && changeState.originalArgs?.planId === plan.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </QueryState>
    </>
  );
}
