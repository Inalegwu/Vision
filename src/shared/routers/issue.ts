import { publicProcedure, router } from "@src/trpc";
import { eq } from "drizzle-orm";
import z from "zod";
import { issues } from "../schema";

const issueRouter = router({
  getMyIssues: publicProcedure.query(async ({ ctx }) => {
    const issues = await ctx.db.query.issues.findMany({});

    return {
      issues,
    };
  }),
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
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(issues)
        .where(eq(issues.id, input.issueId))
        .returning();

      return { deleted };
    }),
});

export default issueRouter;
