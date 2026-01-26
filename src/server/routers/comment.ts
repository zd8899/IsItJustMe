import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";

export const commentRouter = router({
  create: publicProcedure
    .input(
      z.object({
        content: z.string().min(1).max(2000),
        postId: z.string(),
        parentId: z.string().optional(),
        anonymousId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate post exists
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post not found",
        });
      }

      // If parentId is provided, validate parent comment exists
      if (input.parentId) {
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: input.parentId },
        });

        if (!parentComment) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parent comment not found",
          });
        }
      }

      const comment = await ctx.prisma.comment.create({
        data: {
          content: input.content,
          postId: input.postId,
          parentId: input.parentId,
          anonymousId: input.anonymousId,
          upvotes: 0,
          downvotes: 0,
          score: 0,
        },
      });

      // Update post comment count
      await ctx.prisma.post.update({
        where: { id: input.postId },
        data: { commentCount: { increment: 1 } },
      });

      return comment;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { username: true } },
          replies: {
            orderBy: { score: "desc" },
            include: {
              user: { select: { username: true } },
            },
          },
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      return comment;
    }),

  listByPost: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.comment.findMany({
        where: { postId: input.postId, parentId: null },
        orderBy: { score: "desc" },
        include: {
          user: { select: { username: true } },
          replies: {
            orderBy: { score: "desc" },
            include: {
              user: { select: { username: true } },
            },
          },
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if comment exists
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.id },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Delete comment (cascades to replies and votes due to onDelete: Cascade)
      await ctx.prisma.comment.delete({
        where: { id: input.id },
      });

      // Update post comment count
      await ctx.prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });

      return { success: true };
    }),
});
