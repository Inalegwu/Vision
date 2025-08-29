import { deletionChannel, parserChannel } from "@shared/channels";
import cacheWorker from "@src/shared/core/workers/cache?nodeWorker";
import fileSystemWatchWorker from "@src/shared/core/workers/watcher?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { observable } from "@trpc/server/observable";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import * as Array from "effect/Array";
import { dialog } from "electron";
import { v4 } from "uuid";
import { z } from "zod";
import {
  collections as collectionsSchema,
  issues as issueSchema,
} from "../schema";
import { sortPages } from "../utils";

const libraryRouter = router({
  launchWatcher: publicProcedure.mutation(async () => {
    console.log("launching watcher worker");
    fileSystemWatchWorker({
      name: "fs-watcher-worker",
    })
      .on("message", console.log)
      .postMessage({
        activate: true,
      });

    return {
      success: true,
    };
  }),
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
          (issue, issueInCollection) =>
            issue.issueTitle === issueInCollection.issueTitle,
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
    .query(
      async ({ ctx, input }) =>
        await Effect.Do.pipe(
          Effect.bind("collection", () =>
            Effect.tryPromise(
              async () =>
                await ctx.db.query.collections.findFirst({
                  where: (collections, { eq }) =>
                    eq(collections.id, input.collectionId),
                  with: {
                    issues: true,
                  },
                  columns: {
                    collectionName: true,
                    id: true,
                  },
                }),
            ),
          ),
          Effect.flatMap(({ collection }) =>
            Effect.succeed({
              issues: collection?.issues.sort((issueI, issueK) =>
                sortPages(issueI.issueTitle, issueK.issueTitle),
              ),
              collection,
            }),
          ),
          Effect.runPromise,
        ),
    ),
  getCollections: publicProcedure.query(
    async ({ ctx }) =>
      await Effect.tryPromise(
        async () => await ctx.db.query.collections.findMany(),
      ).pipe(Effect.runPromise),
  ),
  deleteCollection: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await Effect.Do.pipe(
          Effect.bind("deleted", () =>
            Effect.tryPromise(
              async () =>
                await ctx.db
                  .delete(collectionsSchema)
                  .where(eq(collectionsSchema.id, input.collectionId))
                  .returning(),
            ),
          ),
          Effect.tap(Effect.logInfo),
          Effect.flatMap(({ deleted }) => Effect.succeed(deleted)),
          Effect.runPromise,
        ),
    ),
  addIssueToCollection: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
        issueId: z.string(),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await Effect.Do.pipe(
          Effect.bind("added", () =>
            Effect.tryPromise(
              async () =>
                await ctx.db
                  .update(issueSchema)
                  .set({
                    collectionId: input.collectionId,
                  })
                  .where(eq(issueSchema.id, input.issueId))
                  .returning(),
            ),
          ),
          Effect.flatMap(({ added }) => Effect.succeed(added)),
        ).pipe(Effect.runPromise),
    ),
  removeFromCollection: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await Effect.Do.pipe(
          Effect.bind("updated", () =>
            Effect.tryPromise(
              async () =>
                await ctx.db
                  .update(issueSchema)
                  .set({
                    collectionId: null,
                  })
                  .where(eq(issueSchema.id, input.issueId)),
            ),
          ),
          Effect.flatMap(({ updated }) => Effect.succeed(updated)),
          Effect.runPromise,
        ),
    ),
  createCollection: publicProcedure
    .input(
      z.object({
        collectionName: z.string(),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await Effect.Do.pipe(
          Effect.bind("newCollection", () =>
            Effect.tryPromise(
              async () =>
                await ctx.db
                  .insert(collectionsSchema)
                  .values({
                    id: v4(),
                    collectionName: input.collectionName,
                  })
                  .returning({
                    name: collectionsSchema.collectionName,
                  }),
            ),
          ),
          Effect.flatMap(({ newCollection }) =>
            Effect.succeed(newCollection.at(0)),
          ),
          Effect.runPromise,
        ),
    ),
  addToCollectionInBulk: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
        issues: z.array(z.string()),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await Effect.forEach(input.issues, (issueId) =>
          Effect.tryPromise(
            async () =>
              await ctx.db
                .update(issueSchema)
                .set({
                  collectionId: input.collectionId,
                })
                .where(eq(issueSchema.id, issueId)),
          ),
        ).pipe(
          Effect.catchTag("UnknownException", Effect.logFatal),
          Effect.orDie,
          Effect.runPromise,
        ),
    ),
  emptyCache: publicProcedure.mutation(async ({ ctx }) => {
    cacheWorker({
      name: "cache-worker",
    })
      .on("message", console.log)
      .postMessage({});

    return {
      success: true,
    };
  }),
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
  // subscriptions
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
});

// {
//   console.log({ input });

//   const deleted = await ctx.db
//     .delete(collectionsSchema)
//     .where(eq(collectionsSchema.id, input.collectionId))
//     .returning();

//   console.log(deleted);

//   return {
//         deleted: deleted[0],
//       };
// }

export default libraryRouter;
