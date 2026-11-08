import { prisma } from "../src/config/prisma.js";
import { auth } from "../src/config/auth.js";
import { env } from "../src/config/env.js";
import { syncCatalog } from "../src/engine/catalog.js";

const PLANS = [
  {
    slug: "free",
    name: "Free",
    description: "Get started with essential website checks.",
    priceMonthly: 0,
    priceYearly: 0,
    scanLimit: 10,
    websiteLimit: 2,
    features: ["10 scans per month", "2 websites", "All core checks", "Printable PDF reports"],
    isDefault: true,
    order: 1,
  },
  {
    slug: "pro",
    name: "Pro",
    description: "For freelancers and growing businesses.",
    priceMonthly: 2900,
    priceYearly: 29000,
    scanLimit: 200,
    websiteLimit: 25,
    features: ["200 scans per month", "25 websites", "Scan history & trends", "Priority support"],
    order: 2,
  },
  {
    slug: "agency",
    name: "Agency",
    description: "Unlimited audits for agencies and teams.",
    priceMonthly: 9900,
    priceYearly: 99000,
    scanLimit: -1,
    websiteLimit: -1,
    features: ["Unlimited scans", "Unlimited websites", "White-label reports", "Dedicated support"],
    order: 3,
  },
];

const main = async () => {
  for (const plan of PLANS) {
    await prisma.plan.upsert({ where: { slug: plan.slug }, create: plan, update: {} });
  }
  console.info(`Plans: ${PLANS.length}`);

  await syncCatalog();
  console.info("Checker catalog synced");

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const existing = await prisma.user.findUnique({ where: { email: env.ADMIN_EMAIL } });
    if (!existing) {
      await auth.api.signUpEmail({ body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, name: env.ADMIN_NAME } });
    }
    await prisma.user.update({ where: { email: env.ADMIN_EMAIL }, data: { role: "admin", emailVerified: true } });
    console.info(`Admin ready: ${env.ADMIN_EMAIL}`);
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set; skipping admin creation");
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
