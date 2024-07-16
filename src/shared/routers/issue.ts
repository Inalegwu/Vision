import { publicProcedure, router } from "@src/trpc";
import z from "zod";
import deletionWorker from "../workers/deletion?nodeWorker";

const issueRouter = router({
  addIssue: publicProcedure.mutation(async ({ ctx }) => {
    // TODO

    return {
      hm: "hmmm",
    };
  }),
  getIssueMetadata: publicProcedure
    .input(
      z.object({
        issueName: z.string().refine((v) => v.trim()),
      }),
    )
    .query(async ({ input }) => {
      // TODO: fetch issue metadata and populate"
      return {
        hm: "hmm",
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
      });

      const merged = {
        ...issue,
        pages,
      };

      return merged;
    }),
});

export default issueRouter;
