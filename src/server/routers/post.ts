import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const postRouter = router({
  create: publicProcedure
    .input(
      z.object({
        frustration: z.string().min(1).max(500),
        identity: z.string().min(1).max(100),
        categoryId: z.string(),
        anonymousId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement post creation
      return { success: true };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: {
          category: true,
          user: { select: { username: true } },
          _count: { select: { comments: true } },
        },
      });
    }),

  listHot: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        categorySlug: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
        where: input.categorySlug
          ? { category: { slug: input.categorySlug } }
          : undefined,
        include: {
          category: true,
          user: { select: { username: true } },
        },
      });

      let nextCursor: string | undefined;
      if (posts.length > input.limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return { posts, nextCursor };
    }),

  listNew: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        categorySlug: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: input.categorySlug
          ? { category: { slug: input.categorySlug } }
          : undefined,
        include: {
          category: true,
          user: { select: { username: true } },
        },
      });

      let nextCursor: string | undefined;
      if (posts.length > input.limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return { posts, nextCursor };
    }),

  listByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.post.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
        },
      });
    }),
});
