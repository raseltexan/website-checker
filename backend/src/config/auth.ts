import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { env } from "./env.js";
import { prisma } from "./prisma.js";
import { sendMail } from "../utils/mailer.js";
import { logActivity } from "../utils/activity.js";
import { getSetting } from "../modules/settings/settings.service.js";

const requestMeta = (request?: Request) => ({
  ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
  userAgent: request?.headers.get("user-agent") ?? undefined,
});

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  trustedOrigins: env.clientOrigins,
  database: prismaAdapter(prisma, { provider: "mongodb" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      const url = `${env.clientOrigins[0]}/reset-password?token=${encodeURIComponent(token)}`;
      await sendMail({
        to: user.email,
        subject: "Reset your Texan Website Checker password",
        template: "reset-password",
        html: `<p>Hi ${user.name},</p><p>Use the link below to reset your password. It expires in one hour.</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  user: {
    additionalFields: {
      company: { type: "string", required: false, input: true },
      timezone: { type: "string", required: false, defaultValue: "UTC", input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  rateLimit: { enabled: true, window: 60, max: 100 },
  advanced: {
    useSecureCookies: env.isProduction,
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: env.isProduction },
  },
  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const general = await getSetting("general");
          if (!general.allowRegistration && user.email !== env.ADMIN_EMAIL) {
            throw new APIError("FORBIDDEN", { message: "Registration is currently disabled" });
          }
          return { data: user };
        },
        after: async (user) => {
          const plan = await prisma.plan.findFirst({ where: { isDefault: true, isActive: true } });
          if (plan) await prisma.subscription.create({ data: { userId: user.id, planId: plan.id } });
          await logActivity({ userId: user.id, action: "auth.register", entity: "user", entityId: user.id });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await logActivity({
            userId: session.userId,
            action: "auth.login",
            entity: "session",
            ipAddress: session.ipAddress ?? undefined,
            userAgent: session.userAgent ?? undefined,
          });
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const returned = ctx.context.returned;
      const failed = returned instanceof APIError;
      if (ctx.path === "/sign-in/email" && failed) {
        await logActivity({
          action: "auth.login_failed",
          level: "SECURITY",
          metadata: { email: (ctx.body as { email?: string } | undefined)?.email ?? null, reason: returned.message },
          ...requestMeta(ctx.request),
        });
      }
      if (ctx.path === "/change-password" && !failed && ctx.context.session) {
        await logActivity({
          userId: ctx.context.session.user.id,
          action: "auth.password_changed",
          level: "SECURITY",
          ...requestMeta(ctx.request),
        });
      }
      if (ctx.path === "/reset-password" && !failed) {
        await logActivity({ action: "auth.password_reset", level: "SECURITY", ...requestMeta(ctx.request) });
      }
    }),
  },
});

export type AuthSession = typeof auth.$Infer.Session;
