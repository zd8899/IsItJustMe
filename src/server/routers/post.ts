import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
      // Validate category exists
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid category",
        });
      }

      const post = await ctx.prisma.post.create({
        data: {
          frustration: input.frustration,
          identity: input.identity,
          categoryId: input.categoryId,
          anonymousId: input.anonymousId,
          userId: ctx.userId || undefined,
          upvotes: 0,
          downvotes: 0,
          score: 0,
          hotScore: 0,
          commentCount: 0,
        },
        include: {
          category: true,
          user: { select: { username: true } },
        },
      });

      return post;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: {
          category: true,
          user: { select: { username: true } },
          _count: { select: { comments: true } },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return post;
    }),

  listHot: publicProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
          categorySlug: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const posts = await ctx.prisma.post.findMany({
        take: limit + 1,
        skip: input?.cursor ? 1 : undefined,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
        where: input?.categorySlug
          ? { category: { slug: input.categorySlug } }
          : undefined,
        include: {
          category: true,
          user: { select: { username: true } },
        },
      });

      let nextCursor: string | null = null;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id ?? null;
      }

      return { posts, nextCursor };
    }),

  listNew: publicProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
          categorySlug: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const posts = await ctx.prisma.post.findMany({
        take: limit + 1,
        skip: input?.cursor ? 1 : undefined,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: input?.categorySlug
          ? { category: { slug: input.categorySlug } }
          : undefined,
        include: {
          category: true,
          user: { select: { username: true } },
        },
      });

      let nextCursor: string | null = null;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id ?? null;
      }

      return { posts, nextCursor };
    }),

  listByCategory: publicProcedure
    .input(
      z.object({
        categorySlug: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // First validate that the category exists
      const category = await ctx.prisma.category.findUnique({
        where: { slug: input.categorySlug },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      const limit = input.limit;
      const posts = await ctx.prisma.post.findMany({
        take: limit + 1,
        skip: input.cursor ? 1 : undefined,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: { categoryId: category.id },
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          user: { select: { username: true } },
        },
      });

      let nextCursor: string | null = null;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id ?? null;
      }

      // Map posts to include commentCount from _count
      const postsWithCommentCount = await Promise.all(
        posts.map(async (post) => {
          const commentCount = await ctx.prisma.comment.count({
            where: { postId: post.id },
          });
          return {
            ...post,
            commentCount,
          };
        })
      );

      return { posts: postsWithCommentCount, nextCursor };
    }),

  listByUser: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          _count: { select: { comments: true } },
        },
      });

      // Map posts to include commentCount
      return posts.map((post) => ({
        ...post,
        commentCount: post._count.comments,
      }));
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if post exists
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Delete post (cascades to comments and votes due to onDelete: Cascade)
      await ctx.prisma.post.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
