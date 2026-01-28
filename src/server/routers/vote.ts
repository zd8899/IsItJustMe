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

      // Check for existing vote by anonymousId (if provided) or userId (authenticated user)
      // Prioritize anonymousId when explicitly provided to support anonymous voting
      let existingVote = null;
      if (input.anonymousId) {
        existingVote = await ctx.prisma.vote.findUnique({
          where: {
            postId_anonymousId: {
              postId: input.postId,
              anonymousId: input.anonymousId,
            },
          },
        });
      } else if (ctx.userId) {
        existingVote = await ctx.prisma.vote.findUnique({
          where: {
            postId_userId: {
              postId: input.postId,
              userId: ctx.userId,
            },
          },
        });
      }

      // Handle existing vote: toggle off (delete) or change direction (update)
      if (existingVote) {
        if (existingVote.value === input.value) {
          // Same value - toggle off (delete vote)
          await ctx.prisma.vote.delete({
            where: { id: existingVote.id },
          });

          // Update post vote counts
          if (existingVote.value === 1) {
            await ctx.prisma.post.update({
              where: { id: input.postId },
              data: {
                upvotes: { decrement: 1 },
                score: { decrement: 1 },
              },
            });
          } else if (existingVote.value === -1) {
            await ctx.prisma.post.update({
              where: { id: input.postId },
              data: {
                downvotes: { decrement: 1 },
                score: { increment: 1 },
              },
            });
          }

          // Update author karma (reverse the vote effect)
          if (post.userId) {
            await ctx.prisma.user.update({
              where: { id: post.userId },
              data: {
                karma: { decrement: existingVote.value },
              },
            });
          }

          return { ...existingVote, deleted: true };
        } else {
          // Different value - change direction (update vote)
          const updatedVote = await ctx.prisma.vote.update({
            where: { id: existingVote.id },
            data: { value: input.value },
          });

          // Update post vote counts for direction change
          if (input.value === 1) {
            // Changed from downvote to upvote
            await ctx.prisma.post.update({
              where: { id: input.postId },
              data: {
                upvotes: { increment: 1 },
                downvotes: { decrement: 1 },
                score: { increment: 2 },
              },
            });
          } else {
            // Changed from upvote to downvote
            await ctx.prisma.post.update({
              where: { id: input.postId },
              data: {
                upvotes: { decrement: 1 },
                downvotes: { increment: 1 },
                score: { decrement: 2 },
              },
            });
          }

          // Update author karma (net change of 2: +2 for downvote->upvote, -2 for upvote->downvote)
          if (post.userId) {
            const karmaChange = input.value === 1 ? 2 : -2;
            await ctx.prisma.user.update({
              where: { id: post.userId },
              data: {
                karma: { increment: karmaChange },
              },
            });
          }

          return { ...updatedVote, updated: true };
        }
      }

      // Create new vote
      // If anonymousId is provided, don't set userId to keep the vote anonymous
      const vote = await ctx.prisma.vote.create({
        data: {
          postId: input.postId,
          value: input.value,
          userId: input.anonymousId ? null : ctx.userId,
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

      // Update author karma for new vote
      if (post.userId) {
        await ctx.prisma.user.update({
          where: { id: post.userId },
          data: {
            karma: { increment: input.value },
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

      // Check for existing vote by anonymousId (if provided) or userId (authenticated user)
      // Prioritize anonymousId when explicitly provided to support anonymous voting
      let existingVote = null;
      if (input.anonymousId) {
        existingVote = await ctx.prisma.vote.findUnique({
          where: {
            commentId_anonymousId: {
              commentId: input.commentId,
              anonymousId: input.anonymousId,
            },
          },
        });
      } else if (ctx.userId) {
        existingVote = await ctx.prisma.vote.findUnique({
          where: {
            commentId_userId: {
              commentId: input.commentId,
              userId: ctx.userId,
            },
          },
        });
      }

      // Handle existing vote: toggle off (delete) or change direction (update)
      if (existingVote) {
        if (existingVote.value === input.value) {
          // Same value - toggle off (delete vote)
          await ctx.prisma.vote.delete({
            where: { id: existingVote.id },
          });

          // Update comment vote counts
          if (existingVote.value === 1) {
            await ctx.prisma.comment.update({
              where: { id: input.commentId },
              data: {
                upvotes: { decrement: 1 },
                score: { decrement: 1 },
              },
            });
          } else if (existingVote.value === -1) {
            await ctx.prisma.comment.update({
              where: { id: input.commentId },
              data: {
                downvotes: { decrement: 1 },
                score: { increment: 1 },
              },
            });
          }

          // Update author karma (reverse the vote effect)
          if (comment.userId) {
            await ctx.prisma.user.update({
              where: { id: comment.userId },
              data: {
                karma: { decrement: existingVote.value },
              },
            });
          }

          return { ...existingVote, deleted: true };
        } else {
          // Different value - change direction (update vote)
          const updatedVote = await ctx.prisma.vote.update({
            where: { id: existingVote.id },
            data: { value: input.value },
          });

          // Update comment vote counts for direction change
          if (input.value === 1) {
            // Changed from downvote to upvote
            await ctx.prisma.comment.update({
              where: { id: input.commentId },
              data: {
                upvotes: { increment: 1 },
                downvotes: { decrement: 1 },
                score: { increment: 2 },
              },
            });
          } else {
            // Changed from upvote to downvote
            await ctx.prisma.comment.update({
              where: { id: input.commentId },
              data: {
                upvotes: { decrement: 1 },
                downvotes: { increment: 1 },
                score: { decrement: 2 },
              },
            });
          }

          // Update author karma (net change of 2: +2 for downvote->upvote, -2 for upvote->downvote)
          if (comment.userId) {
            const karmaChange = input.value === 1 ? 2 : -2;
            await ctx.prisma.user.update({
              where: { id: comment.userId },
              data: {
                karma: { increment: karmaChange },
              },
            });
          }

          return { ...updatedVote, updated: true };
        }
      }

      // Create new vote
      // If anonymousId is provided, don't set userId to keep the vote anonymous
      const vote = await ctx.prisma.vote.create({
        data: {
          commentId: input.commentId,
          value: input.value,
          userId: input.anonymousId ? null : ctx.userId,
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

      // Update author karma for new vote
      if (comment.userId) {
        await ctx.prisma.user.update({
          where: { id: comment.userId },
          data: {
            karma: { increment: input.value },
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
