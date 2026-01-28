import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";

export const userRouter = router({
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.prisma.user.findUnique({
        where: { username: input.username },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username already taken",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          username: input.username,
          passwordHash,
        },
      });

      return { id: user.id, username: user.username, karma: user.karma };
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
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
      // Calculate postKarma: sum of score from all posts by this user
      const postKarmaResult = await ctx.prisma.post.aggregate({
        where: { userId: input.userId },
        _sum: { score: true },
      });
      const postKarma = postKarmaResult._sum.score ?? 0;

      // Calculate commentKarma: sum of score from all comments by this user
      const commentKarmaResult = await ctx.prisma.comment.aggregate({
        where: { userId: input.userId },
        _sum: { score: true },
      });
      const commentKarma = commentKarmaResult._sum.score ?? 0;

      // Calculate totalKarma
      const totalKarma = postKarma + commentKarma;

      return {
        postKarma,
        commentKarma,
        totalKarma,
      };
    }),
});
