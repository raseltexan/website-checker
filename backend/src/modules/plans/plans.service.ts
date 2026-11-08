import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { createPlanSchema, updatePlanSchema } from "./plans.validation.js";

type CreatePlan = z.infer<typeof createPlanSchema>;
type UpdatePlan = z.infer<typeof updatePlanSchema>;

export const listActivePlans = () => prisma.plan.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });

export const listAllPlans = async () => {
  const plans = await prisma.plan.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { subscriptions: true } } } });
  return plans.map(({ _count, ...plan }) => ({ ...plan, subscribers: _count.subscriptions }));
};

/** Only one plan can be the default (assigned on sign-up). */
const clearDefault = (exceptId?: string) => prisma.plan.updateMany({ where: { isDefault: true, ...(exceptId ? { id: { not: exceptId } } : {}) }, data: { isDefault: false } });

export const createPlan = async (data: CreatePlan) => {
  const plan = await prisma.plan.create({ data });
  if (plan.isDefault) await clearDefault(plan.id);
  return plan;
};

export const updatePlan = async (id: string, data: UpdatePlan) => {
  const plan = await prisma.plan.update({ where: { id }, data });
  if (plan.isDefault) await clearDefault(plan.id);
  return plan;
};

export const deletePlan = async (id: string) => {
  const subscribers = await prisma.subscription.count({ where: { planId: id } });
  if (subscribers) throw ApiError.conflict(`Plan has ${subscribers} subscriber(s). Deactivate it instead.`);
  await prisma.plan.delete({ where: { id } });
};
