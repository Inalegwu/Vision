import * as fs from "node:fs";
import deletionWorker from "@core/workers/deletion?nodeWorker";
import parseWorker from "@core/workers/parser?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { eq } from "drizzle-orm";
import { dialog } from "electron";
import z from "zod";
import { issues } from "../schema";

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

      const pages = fs.readdirSync(issue?.path!, {
        recursive: true,
        encoding: "utf-8",
      });

      console.log({ pages });

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
  editIssueTitle: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
        issueTitle: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(issues)
        .set({
          issueTitle: input.issueTitle,
        })
        .where(eq(issues.id, input.issueId))
        .returning();

      return {
        result,
      };
    }),
});

export default issueRouter;
