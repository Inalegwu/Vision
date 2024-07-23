import watchFS from "@core/watcher";
import { publicProcedure, router } from "@src/trpc";
import { mkdirSync } from "node:fs";

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
});

export default libraryRouter;
