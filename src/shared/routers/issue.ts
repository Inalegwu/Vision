import deletionWorker from "@core/workers/deletion?nodeWorker";
import parseWorker from "@core/workers/parser?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { Array, pipe } from "effect";
import { dialog } from "electron";
import * as fs from "node:fs";
import path from "node:path";
import { v4 } from "uuid";
import z from "zod";
import { issues } from "../schema";
import { convertToImageUrl } from "../utils";

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

      if (!issue)
        throw new TRPCError({
          message: "Issue doesn't exist",
          code: "NOT_FOUND",
        });

      const pages = pipe(
        fs.readdirSync(issue.path, {
          encoding: "utf-8",
        }),
        Array.filter((path) => !path.includes(".xml")),
        Array.map((directory) => ({
          id: v4(),
          data: convertToImageUrl(
            fs.readFileSync(path.join(issue.path, directory)).buffer,
          ),
        })),
      );

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
