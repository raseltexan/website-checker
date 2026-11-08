import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { auth } from "./config/auth.js";
import { apiRouter } from "./routes.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

export const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(morgan(env.isProduction ? "combined" : "dev"));

// Better Auth must receive the raw body, so mount it before express.json().
app.all("/api/auth/{*splat}", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "OK", data: { uptime: Math.round(process.uptime()) } });
});

app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);
