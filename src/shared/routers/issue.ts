import deletionWorker from "@core/workers/deletion?nodeWorker";
import metadataWorker from "@core/workers/metadata?nodeWorker";
import parseWorker from "@core/workers/parser?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { dialog } from "electron";
import z from "zod";
import type { parsePathSchema } from "../core/validations";

const issueRouter = router({
  addIssue: publicProcedure.mutation(async ({ ctx }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: "Comic Book Archive", extensions: ["cbz", "cbrx"] }],
    });
    if (canceled) {
      return {
        cancelled: true,
        completed: false,
      };
    }

    parseWorker({
      name: "parse-worker",
    })
      .on("message", (m) => {
        console.log(m);
      })
      .postMessage({
        parsePath: filePaths[0],
        action: "LINK",
      } satisfies z.infer<typeof parsePathSchema>);

    return {
      completed: true,
      cancelled: false,
    };
  }),
  getIssueMetadata: publicProcedure
    .input(
      z.object({
        issueName: z.string().refine((v) => v.trim()),
      }),
    )
    .query(async ({ input }) =>
      metadataWorker({ name: "meta-data-worker" }).postMessage({
        issueTitle: input.issueName,
      }),
    ),
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

      return {
        issue,
      };
    }),
});

export default issueRouter;
