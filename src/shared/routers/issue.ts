import deletionWorker from "@core/workers/deletion?nodeWorker";
import parseWorker from "@core/workers/parser?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { dialog } from "electron";
import z from "zod";
import type { parsePathSchema } from "@core/validations";
import {convertToImageUrl} from "@shared/utils";
import {TRPCError} from "@trpc/server";

const issueRouter = router({
  addIssue: publicProcedure.mutation(async ({ ctx }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: "Comic Book Archive", extensions: ["cbz", "cbr"] }],
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
  getIssue: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const issue = await ctx.db.query.issues.findFirst({
        where: (issues, { eq }) => eq(issues.id, input.issueId),
        with: {
          attachments: true,
        },
      });

      if(!issue){
        throw new TRPCError({
          code:"INTERNAL_SERVER_ERROR",
          message:`No issue with ${input.issueId} exists`
        })
      }


      return {
        issue,
      };
    }),
});

export default issueRouter;
