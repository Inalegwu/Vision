import deletionWorker from "@core/workers/deletion?nodeWorker";
import parseWorker from "@core/workers/parser?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { dialog } from "electron";
import z from "zod";

const issueRouter = router({
  addIssue: publicProcedure.mutation(async ({ ctx }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: "Comic Book Archive", extensions: ["cbz", "cbr"] }],
      properties: ["multiSelections"],
    });

    if (canceled) {
      return {
        cancelled: true,
        completed: false,
      };
    }

    for (const parsePath of filePaths) {
      parseWorker({
        name: `parse-worker-${parsePath}`,
      })
        .on("message", (m) => {
          console.log(m);
        })
        .postMessage({
          parsePath,
          action: "LINK",
        } satisfies ParserSchema);
    }

    return {
      completed: true,
      cancelled: false,
    };
  }),
  deleteIssue: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      deletionWorker({
        name: "deletion-worker",
      }).postMessage({
        issueId: input.issueId,
      }),
    ),
  getPages: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const issue = await ctx.db.query.issues.findFirst({
        where: (issue, { eq }) => eq(issue.id, input.issueId),
      });
      const pages = await ctx.db.query.pages.findMany({
        where: (page, { eq }) => eq(page.issueId, input.issueId),
        columns: {
          id: true,
          pageContent: true,
        },
      });

      const merged = {
        ...issue,
        pages,
      };

      return merged;
    }),
  getIssue: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const issue = await ctx.db.query.issues.findFirst({
        where: (issues, { eq }) => eq(issues.id, input.issueId),
      });
      const metadata = await ctx.db.query.metadata.findFirst({
        where: (meta, { eq }) => eq(meta.issueId, input.issueId),
      });

      return {
        issue,
        metadata,
      };
    }),
});

export default issueRouter;
