import watchFS from "@core/watcher";
import prefetchWorker from "@core/workers/prefetch?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { mkdirSync } from "node:fs";
import { v4 } from "uuid";
import z from "zod";
import { collections } from "../schema";

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
            thumbnailUrl: true,
          },
          limit: 2,
        },
      },
    });

    return {
      issues,
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
});

export default libraryRouter;
