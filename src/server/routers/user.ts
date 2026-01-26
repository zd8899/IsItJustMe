import { z } from "zod";
import bcrypt from "bcryptjs";
import { router, publicProcedure } from "../trpc";

export const userRouter = router({
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(20),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.prisma.user.findUnique({
        where: { username: input.username },
      });

      if (existingUser) {
        throw new Error("Username already taken");
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          username: input.username,
          passwordHash,
        },
      });

      return { id: user.id, username: user.username };
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          username: true,
          karma: true,
          createdAt: true,
          _count: { select: { posts: true, comments: true } },
        },
      });
    }),

  getKarma: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { karma: true },
      });
      return user?.karma ?? 0;
    }),
});
