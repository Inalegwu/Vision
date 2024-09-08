import watchFS from "@core/watcher";
import { publicProcedure, router } from "@src/trpc";
import { mkdirSync } from "node:fs";
import z from "zod";

const libraryRouter = router({
  createLibraryFolder: publicProcedure.mutation(async ({ ctx }) => {
    const path = `${ctx.app.getPath("documents")}/Vision`;
    mkdirSync(path);
  }),
  startLibraryWatcher: publicProcedure.mutation(async ({ ctx }) =>
    watchFS(`${ctx.app.getPath("documents")}/Vision`)?.match(
      ({ message }) => {
        console.log({ message });
      },
      ({ error }) => {
        console.error({ error });
      },
    ),
  ),
  getLibrary: publicProcedure.query(async ({ ctx }) => {
    const issues = await ctx.db.query.issues.findMany({
      with: {
        attachments: {
          limit: 1,
        },
      },
    });

    return {
      issues,
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
    }),
});

export default libraryRouter;
