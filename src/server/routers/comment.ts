import { z } from "zod";
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
      // TODO: Implement comment creation
      return { success: true };
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
});
