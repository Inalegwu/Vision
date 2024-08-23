import deletionWorker from "@core/workers/deletion?nodeWorker";
import parseWorker from "@core/workers/parser?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { dialog } from "electron";
import z from "zod";
import type { parsePathSchema } from "../core/validations";

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
  getPages: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log({ input });

      return true
    }),
  getIssue: publicProcedure
    .input(
      z.object({
        issueId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return true
    }),
});

export default issueRouter;
