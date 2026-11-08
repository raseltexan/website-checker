import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { logActivity } from "../../utils/activity.js";
import { buildListArgs, paginate } from "../../utils/query.js";
import { getPaymentProvider } from "./payment.provider.js";
import type { SubscriptionListQuery } from "./billing.validation.js";

export const listSubscriptions = (query: SubscriptionListQuery) => {
  const contains = (v: string) => ({ contains: v, mode: "insensitive" as const });
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { user: { OR: [{ email: contains(query.search) }, { name: contains(query.search) }] } } : {}),
  };
  return paginate(
    query,
    () =>
      prisma.subscription.findMany({
        where,
        ...buildListArgs(query, ["createdAt", "status", "currentPeriodEnd"]),
        include: { plan: true, user: { select: { id: true, name: true, email: true } } },
      }),
    () => prisma.subscription.count({ where }),
  );
};

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/** Active plan for a user, falling back to the default plan. */
export const getUserPlan = async (userId: string) => {
  const sub = await prisma.subscription.findUnique({ where: { userId }, include: { plan: true } });
  if (sub && sub.status !== "CANCELLED") return sub.plan;
  return prisma.plan.findFirst({ where: { isDefault: true } });
};

export const getUsage = async (userId: string) => {
  const [scansThisMonth, websites] = await Promise.all([
    prisma.scan.count({ where: { userId, createdAt: { gte: startOfMonth() } } }),
    prisma.website.count({ where: { userId } }),
  ]);
  return { scansThisMonth, websites };
};

export const assertScanQuota = async (userId: string) => {
  const plan = await getUserPlan(userId);
  if (!plan || plan.scanLimit < 0) return;
  const { scansThisMonth } = await getUsage(userId);
  if (scansThisMonth >= plan.scanLimit) {
    throw ApiError.forbidden(`Monthly scan limit reached (${plan.scanLimit}). Upgrade your plan to run more scans.`);
  }
};

export const assertWebsiteQuota = async (userId: string) => {
  const plan = await getUserPlan(userId);
  if (!plan || plan.websiteLimit < 0) return;
  const { websites } = await getUsage(userId);
  if (websites >= plan.websiteLimit) {
    throw ApiError.forbidden(`Website limit reached (${plan.websiteLimit}). Upgrade your plan to add more websites.`);
  }
};

export const getSubscription = async (userId: string) => {
  const [subscription, usage, plan] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId }, include: { plan: true } }),
    getUsage(userId),
    getUserPlan(userId),
  ]);
  return { subscription, plan, usage, paymentsEnabled: getPaymentProvider() !== null };
};

const periodEnd = (interval: string) => {
  const d = new Date();
  d.setMonth(d.getMonth() + (interval === "yearly" ? 12 : 1));
  return d;
};

/** Directly assigns a plan (used for free plans and by admins). */
export const assignPlan = async (userId: string, planId: string, interval: "monthly" | "yearly" = "monthly") => {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw ApiError.notFound("Plan");
  const data = { planId, interval, status: "ACTIVE" as const, cancelAtPeriodEnd: false, currentPeriodEnd: periodEnd(interval) };
  return prisma.subscription.upsert({ where: { userId }, create: { userId, ...data }, update: data, include: { plan: true } });
};

export const changePlan = async (userId: string, planId: string, interval: "monthly" | "yearly") => {
  const plan = await prisma.plan.findFirst({ where: { id: planId, isActive: true } });
  if (!plan) throw ApiError.notFound("Plan");
  const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;

  if (price > 0) {
    const provider = getPaymentProvider();
    if (!provider) throw ApiError.paymentRequired("Online payments are not configured yet. Please contact support to upgrade.");
    return { checkoutUrl: await provider.createCheckout({ userId, plan, interval }) };
  }

  const subscription = await assignPlan(userId, planId, interval);
  await logActivity({ userId, action: "billing.plan_changed", entity: "subscription", entityId: subscription.id, metadata: { plan: plan.slug } });
  return { subscription };
};

export const cancelSubscription = async (userId: string) => {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) throw ApiError.notFound("Subscription");
  const updated = await prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true }, include: { plan: true } });
  await logActivity({ userId, action: "billing.cancel_requested", entity: "subscription", entityId: sub.id });
  return updated;
};

export const resumeSubscription = async (userId: string) =>
  prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: false }, include: { plan: true } });
