import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";

export const voteRouter = router({
  castPostVote: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        value: z.number().min(-1).max(1),
        anonymousId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if post exists
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check for existing vote by userId (authenticated user)
      if (ctx.userId) {
        const existingVote = await ctx.prisma.vote.findUnique({
          where: {
            postId_userId: {
              postId: input.postId,
              userId: ctx.userId,
            },
          },
        });

        if (existingVote) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already voted on this post",
          });
        }
      }

      // Check for existing vote by anonymousId
      if (input.anonymousId) {
        const existingVote = await ctx.prisma.vote.findUnique({
          where: {
            postId_anonymousId: {
              postId: input.postId,
              anonymousId: input.anonymousId,
            },
          },
        });

        if (existingVote) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already voted on this post",
          });
        }
      }

      // Create vote
      const vote = await ctx.prisma.vote.create({
        data: {
          postId: input.postId,
          value: input.value,
          userId: ctx.userId,
          anonymousId: input.anonymousId,
          ipHash: input.anonymousId || ctx.userId || "unknown",
        },
      });

      // Update post vote counts and score
      if (input.value === 1) {
        await ctx.prisma.post.update({
          where: { id: input.postId },
          data: {
            upvotes: { increment: 1 },
            score: { increment: 1 },
          },
        });
      } else if (input.value === -1) {
        await ctx.prisma.post.update({
          where: { id: input.postId },
          data: {
            downvotes: { increment: 1 },
            score: { decrement: 1 },
          },
        });
      }

      return vote;
    }),

  castCommentVote: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
        value: z.number().min(-1).max(1),
        anonymousId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if comment exists
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check for existing vote by userId (authenticated user)
      if (ctx.userId) {
        const existingVote = await ctx.prisma.vote.findUnique({
          where: {
            commentId_userId: {
              commentId: input.commentId,
              userId: ctx.userId,
            },
          },
        });

        if (existingVote) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already voted on this comment",
          });
        }
      }

      // Check for existing vote by anonymousId
      if (input.anonymousId) {
        const existingVote = await ctx.prisma.vote.findUnique({
          where: {
            commentId_anonymousId: {
              commentId: input.commentId,
              anonymousId: input.anonymousId,
            },
          },
        });

        if (existingVote) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already voted on this comment",
          });
        }
      }

      // Create vote
      const vote = await ctx.prisma.vote.create({
        data: {
          commentId: input.commentId,
          value: input.value,
          userId: ctx.userId,
          anonymousId: input.anonymousId,
          ipHash: input.anonymousId || ctx.userId || "unknown",
        },
      });

      // Update comment vote counts and score
      if (input.value === 1) {
        await ctx.prisma.comment.update({
          where: { id: input.commentId },
          data: {
            upvotes: { increment: 1 },
            score: { increment: 1 },
          },
        });
      } else if (input.value === -1) {
        await ctx.prisma.comment.update({
          where: { id: input.commentId },
          data: {
            downvotes: { increment: 1 },
            score: { decrement: 1 },
          },
        });
      }

      return vote;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const vote = await ctx.prisma.vote.findUnique({
        where: { id: input.id },
      });

      if (!vote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vote not found",
        });
      }

      return vote;
    }),
});
