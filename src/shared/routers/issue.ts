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
});

export default issueRouter;
