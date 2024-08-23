import watchFS from "@core/watcher";
import prefetchWorker from "@core/workers/prefetch?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { mkdirSync } from "node:fs";
import z from "zod";

const libraryRouter = router({
  createLibraryFolder: publicProcedure.mutation(async ({ ctx }) => {
    const path = `${ctx.app.getPath("documents")}/Vision`;
    mkdirSync(path);
  }),
  startLibraryWatcher: publicProcedure.mutation(async ({ ctx }) =>
    watchFS(`${ctx.app.getPath("documents")}/Vision`),
  ),
  getLibrary: publicProcedure.query(async ({ ctx }) => {

    const issues = await ctx.db.allDocs({
      include_docs: true,
      attachments: true
    }).then((v) => v.rows)

    return {
      issues
    }
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
      
    }),
});

export default libraryRouter;
