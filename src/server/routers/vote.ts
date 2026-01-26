import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const voteRouter = router({
  castPostVote: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        value: z.number().min(-1).max(1),
        anonymousId: z.string().optional(),
        ipHash: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement post voting
      return { success: true };
    }),

  castCommentVote: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
        value: z.number().min(-1).max(1),
        anonymousId: z.string().optional(),
        ipHash: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement comment voting
      return { success: true };
    }),
});
