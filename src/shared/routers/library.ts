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
    const issues = await ctx.db.query.issues.findMany({});

    return issues;
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
});

export default libraryRouter;
