import { publicProcedure, router } from "@src/trpc";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { BroadcastChannel } from "broadcast-channel";
import { eq } from "drizzle-orm";
import * as Array from "effect/Array";
import { dialog } from "electron";
import * as NodeFS from "node:fs";
import { v4 } from "uuid";
import { z } from "zod";
import {
  collections as collectionsSchema,
  issues as issueSchema,
} from "../schema";

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");
const deletionChannel = new BroadcastChannel<DeletionChannel>(
  "deletion-channel",
);

const libraryRouter = router({
  getLibrary: publicProcedure.query(async ({ ctx }) => {
    const collections = await ctx.db.query.collections.findMany({
      with: {
        issues: true,
      },
    });

    const issues = await ctx.db.query.issues
      .findMany({
        orderBy: (fields, { asc }) => asc(fields.issueTitle),
      })
      .then((result) =>
        Array.differenceWith<typeof issueSchema.$inferSelect>(
          (a, b) => a.issueTitle === b.issueTitle,
        )(
          result,
          collections.flatMap((c) => c.issues),
        ),
      );

    return {
      issues,
      collections,
    };
  }),
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
  deleteCollection: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log({ input });

      const deleted = await ctx.db
        .delete(collectionsSchema)
        .where(eq(collectionsSchema.id, input.collectionId))
        .returning();

      console.log(deleted);

      return deleted;
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
        .update(issueSchema)
        .set({
          collectionId: input.collectionId,
        })
        .where(eq(issueSchema.id, input.issueId))
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
        .update(issueSchema)
        .set({
          collectionId: null,
        })
        .where(eq(issueSchema.id, input.issueId));

      return {
        changes,
      };
    }),
  createCollection: publicProcedure
    .input(
      z.object({
        collectionName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log({ input });
      await ctx.db.insert(collectionsSchema).values({
        id: v4(),
        collectionName: input.collectionName,
      });
    }),
  emptyCache: publicProcedure.mutation(async ({ ctx }) => {
    NodeFS.rmdirSync(process.env.library_cache!, {
      recursive: true,
    });

    await ctx.db.delete(issueSchema);
    await ctx.db.delete(collectionsSchema);

    return {
      success: true,
    };
  }),
  chooseSourceDirectory: publicProcedure.mutation(async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (canceled) {
      throw new TRPCError({
        message: "Didn't choose a source directory",
        code: "BAD_REQUEST",
      });
    }

    return {
      path: filePaths[0],
    };
  }),
  additions: publicProcedure.subscription(() =>
    observable<ParserChannel>((emit) => {
      const listener = (evt: ParserChannel) => {
        emit.next(evt);
      };

      parserChannel.addEventListener("message", listener);

      return () => {
        parserChannel.removeEventListener("message", listener);
      };
    }),
  ),
  deletions: publicProcedure.subscription(() =>
    observable<DeletionChannel>((emit) => {
      const listener = (event: DeletionChannel) => {
        emit.next(event);
      };

      deletionChannel.addEventListener("message", listener);

      return () => {
        deletionChannel.removeEventListener("message", listener);
      };
    }),
  ),
  addSourceDirectory: publicProcedure.mutation(async ({ ctx }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      buttonLabel: "Select Folder",
      properties: ["openDirectory", "dontAddToRecent"],
    });

    if (canceled) {
      return {
        complete: false,
        filePaths: null,
      };
    }

    return {
      complete: true,
      filePaths,
    };
  }),
});

export default libraryRouter;
