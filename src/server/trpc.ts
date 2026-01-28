import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { decode } from "next-auth/jwt";
import { prisma } from "./db";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "development-secret-change-in-production";

export const createContext = async (opts?: { req?: Request }) => {
  let userId: string | null = null;

  if (opts?.req) {
    let token: string | null = null;

    // Extract token from Authorization header (Bearer token)
    const authHeader = opts.req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Fallback: Extract token from cookie (for browser/test sessions)
    if (!token) {
      const cookieHeader = opts.req.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").map(c => c.trim());
        const authCookie = cookies.find(c => c.startsWith("auth-token="));
        if (authCookie) {
          token = authCookie.split("=")[1];
        }
      }
    }

    // Decode the JWT token to extract the actual userId
    if (token) {
      try {
        const decoded = await decode({ token, secret: JWT_SECRET });
        if (decoded?.sub) {
          userId = decoded.sub as string;
        }
      } catch (e) {
        // Invalid token, userId remains null
      }
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
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? {
                issues: error.cause.errors,
                fieldErrors: error.cause.flatten().fieldErrors,
              }
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
