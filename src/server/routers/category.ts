import { router, publicProcedure } from "../trpc";

export const categoryRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
