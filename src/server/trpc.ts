import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "./db";

export const createContext = async (opts?: { req?: Request }) => {
  let userId: string | null = null;

  // Extract userId from Authorization header (Bearer token)
  if (opts?.req) {
    const authHeader = opts.req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      userId = authHeader.substring(7);
    }
  }

  return {
    prisma,
    userId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
