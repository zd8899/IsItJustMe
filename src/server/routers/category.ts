import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";

export const categoryRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        slug: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if category already exists
      const existingCategory = await ctx.prisma.category.findFirst({
        where: {
          OR: [{ name: input.name }, { slug: input.slug }],
        },
      });

      if (existingCategory) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Category already exists",
        });
      }

      const category = await ctx.prisma.category.create({
        data: {
          name: input.name,
          slug: input.slug,
        },
      });

      return category;
    }),
});
