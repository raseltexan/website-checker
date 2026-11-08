import type { AuthSession } from "../config/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthSession["user"];
      session?: AuthSession["session"];
    }
  }
}

export {};
