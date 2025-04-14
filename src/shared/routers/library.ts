import watchFS from "@core/watcher";
import prefetchWorker from "@core/workers/prefetch?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { observable } from "@trpc/server/observable";
import { BroadcastChannel } from "broadcast-channel";
import { dialog } from "electron";
import { mkdirSync } from "node:fs";
import { v4 } from "uuid";
import z from "zod";
import { view } from "../core/validations";
import { collections } from "../schema";

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
    const issues = await ctx.db.query.issues.findMany({
      orderBy: (fields, { asc }) => asc(fields.issueTitle),
    });

    const collections = await ctx.db.query.collections.findMany({
      with: {
        issues: {
          columns: {
            id: true,
            thumbnailUrl: true,
          },
          orderBy: (fields, { asc }) => asc(fields.issueTitle),
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
        view,
        issueId: z.optional(z.string()),
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
          view: input.view,
          issueId: input.issueId,
        } satisfies PrefetchSchema),
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
      complete: false,
      filePaths,
    };
  }),
});

export default libraryRouter;
