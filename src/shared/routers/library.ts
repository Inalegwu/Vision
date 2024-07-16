import { publicProcedure, router } from "@src/trpc";
import { globalState$ } from "@src/web/state";
import { mkdirSync } from "node:fs";
import watchFS from "../watcher";

const libraryRouter = router({
  createLibraryFolder: publicProcedure.mutation(async ({ ctx }) => {
    const path = `${ctx.app.getPath("documents")}/Vision`;
    mkdirSync(path);
    globalState$.sourceDir.set(path);
  }),
  startLibraryWatcher: publicProcedure.mutation(async ({ ctx }) =>
    watchFS(`${ctx.app.getPath("documents")}/Vision`),
  ),
  getLibrary:publicProcedure.query(async({ctx})=>{
    const issues=await ctx.db.query.issues.findMany({});

    return issues
  })
});

export default libraryRouter;
