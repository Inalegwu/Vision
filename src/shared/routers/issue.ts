import { publicProcedure, router } from "@src/trpc";
import { eq } from "drizzle-orm";
import { dialog } from "electron";
import { createExtractorFromData } from "node-unrar-js";
import { readFileSync } from "node:fs";
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
    const { canceled, filePaths } = await dialog.showOpenDialog({});

    const buffer = readFileSync(filePaths[0]);

    console.log(buffer);

    const extractor = createExtractorFromData({
      wasmBinary: readFileSync(
        require.resolve("node_modules/node-unrar-js/dist/js/unrar.wasm"),
      ).buffer,
      data: Uint8Array.from(buffer),
    });

    console.log(extractor);

    console.log({ canceled, filePaths });
  }),
  getIssueMetadata: publicProcedure
    .input(
      z.object({
        issueName: z.string().refine((v) => v.trim()),
      }),
    )
    .query(async ({ input }) => {
      console.log(input);
      console.log("TODO: fetch issue metadata and populate");
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
