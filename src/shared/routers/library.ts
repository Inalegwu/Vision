import watchFS from "@core/watcher";
import prefetchWorker from "@core/workers/prefetch?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { observable } from "@trpc/server/observable";
import { BroadcastChannel } from "broadcast-channel";
import { mkdirSync } from "node:fs";
import { v4 } from "uuid";
import z from "zod";
import { collections } from "../schema";
import type { DeletionChannel, ParserChannel } from "../types";

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");
const deletionChannel = new BroadcastChannel<DeletionChannel>(
  "deletion-channel",
);

const libraryRouter = router({
  createLibraryFolder: publicProcedure.mutation(async ({ ctx }) => {
    const path = `${ctx.app.getPath("documents")}/Vision`;
    mkdirSync(path);
  }),
  startLibraryWatcher: publicProcedure.mutation(async ({ ctx }) =>
    watchFS(`${ctx.app.getPath("documents")}/Vision`),
  ),
  getLibrary: publicProcedure.query(async ({ ctx }) => {
    const issues = await ctx.db.query.issues.findMany({});
    const collections = await ctx.db.query.collections.findMany({
      with: {
        issues: {
          columns: {
            id: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    return {
      issues: issues.filter(
        (issue) =>
          !collections.find((collection) =>
            collection.issues.find((issueK) => issueK.id === issue.id),
          ),
      ),
      collections,
    };
  }),
  prefetchLibrary: publicProcedure
    .input(
      z.object({
        queryKey: z.string(),
      }),
    )
    .mutation(async ({ input }) =>
      prefetchWorker({
        name: "prefetch-worker",
      })
        .on("message", (m) => {
          console.log({ m });
        })
        .postMessage({
          queryKey: input.queryKey,
        }),
    ),
  createCollection: publicProcedure
    .input(
      z.object({
        collectionName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log({ input });
      await ctx.db.insert(collections).values({
        id: v4(),
        collectionName: input.collectionName,
      });
    }),
  additions: publicProcedure.subscription(() => {
    return observable<ParserChannel>((emit) => {
      const listener = (evt: ParserChannel) => {
        emit.next(evt);
      };

      parserChannel.addEventListener("message", listener);

      return () => {
        parserChannel.removeEventListener("message", listener);
      };
    });
  }),
  deletions: publicProcedure.subscription(() => {
    return observable<DeletionChannel>((emit) => {
      const listener = (event: DeletionChannel) => {
        emit.next(event);
      };

      deletionChannel.addEventListener("message", listener);

      return () => {
        deletionChannel.removeEventListener("message", listener);
      };
    });
  }),
});

export default libraryRouter;
