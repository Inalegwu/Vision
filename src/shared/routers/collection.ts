import { publicProcedure, router } from "@src/trpc";
import { z } from "zod";
import { issues, collections as collectionsSchema } from "../schema";
import { eq } from "drizzle-orm";

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
  getCollections: publicProcedure.query(async ({ ctx }) => {
    const collections = await ctx.db.query.collections.findMany({});

    return {
      collections,
    };
  }),
  addIssueToCollection: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
        issueId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(input);

      const returns = await ctx.db
        .update(issues)
        .set({
          collectionId: input.collectionId,
        })
        .where(eq(issues.id, input.issueId))
        .returning();

      return {
        data: returns,
      };
    }),
  removeFromCollection: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const changes = await ctx.db
        .update(issues)
        .set({
          collectionId: null,
        })
        .where(eq(issues.id, input.issueId));

      return {
        changes,
      };
    }),
});

export default collections;
