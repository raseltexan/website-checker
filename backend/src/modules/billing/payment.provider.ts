import type { Plan } from "@prisma/client";

export interface CheckoutInput {
  userId: string;
  plan: Plan;
  interval: "monthly" | "yearly";
}

/** Contract for a payment gateway (Stripe, Paddle, ...). Implement and return it from getPaymentProvider(). */
export interface PaymentProvider {
  name: string;
  createCheckout(input: CheckoutInput): Promise<string>;
}

/**
 * No payment gateway is bundled. Paid plan upgrades are rejected with a clear message
 * until a provider is implemented here; admins can still assign plans manually.
 */
export const getPaymentProvider = (): PaymentProvider | null => null;
