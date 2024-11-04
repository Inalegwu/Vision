import { publicProcedure, router } from "@src/trpc";
import { z } from "zod";

const collections = router({
  getCollectionById: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const collection = await ctx.db.query.collections.findFirst({
        where: (collections, { eq }) => eq(collections.id, input.collectionId),
        with: {
          issues: true,
        },
      });

      return {
        collection,
      };
    }),
});

export default collections;
