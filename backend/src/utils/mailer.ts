import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

let transporter: Transporter | null = null;

const getTransporter = () => {
  if (!env.smtpConfigured) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
};

interface MailInput {
  to: string;
  subject: string;
  html: string;
  template: string;
}

/** Sends an email when SMTP is configured and records the outcome in EmailLog. */
export const sendMail = async ({ to, subject, html, template }: MailInput) => {
  const transport = getTransporter();
  if (!transport) {
    await prisma.emailLog.create({ data: { to, subject, template, status: "SKIPPED", error: "SMTP not configured" } });
    if (!env.isProduction) console.info(`[mail:skipped] ${subject} -> ${to}\n${html}`);
    return false;
  }
  try {
    await transport.sendMail({ from: env.SMTP_FROM, to, subject, html });
    await prisma.emailLog.create({ data: { to, subject, template, status: "SENT" } });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.emailLog.create({ data: { to, subject, template, status: "FAILED", error: message } });
    return false;
  }
};

export const verifySmtp = async (): Promise<{ configured: boolean; reachable: boolean; error?: string }> => {
  const transport = getTransporter();
  if (!transport) return { configured: false, reachable: false };
  try {
    await transport.verify();
    return { configured: true, reachable: true };
  } catch (error) {
    return { configured: true, reachable: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
