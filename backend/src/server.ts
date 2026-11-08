import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { syncCatalog } from "./engine/catalog.js";
import { recoverScans } from "./engine/runner.js";

/** Fails fast with an actionable message instead of a Prisma stack trace. */
const assertDatabase = async () => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const host = env.DATABASE_URL.replace(/\/\/[^@/]*@/, "//***@").split("/")[2];
    console.error(
      [
        `\nCannot reach MongoDB at ${host}.`,
        "  • Is MongoDB running? Start it with `docker compose up -d` from the project root, or start your local MongoDB.",
        "  • Prisma requires MongoDB to run as a replica set (see README > Quick start).",
        "  • Check DATABASE_URL in backend/.env.",
        `\nDriver error: ${detail.split("\n").filter(Boolean).pop()}`,
      ].join("\n"),
    );
    process.exit(1);
  }
};

const start = async () => {
  await assertDatabase();
  await syncCatalog();
  await recoverScans();

  const server = app.listen(env.PORT, () => {
    console.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.info(`${signal} received, shutting down...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
};

start().catch(async (error) => {
  console.error("Failed to start server", error);
  await prisma.$disconnect();
  process.exit(1);
});
