import { publicProcedure, router } from "@src/trpc";
import { dialog } from "electron";
import { createExtractorFromData } from "node-unrar-js";
import { readFileSync } from "node:fs";

const issueRouter = router({
  getMyIssues: publicProcedure.query(async ({ ctx }) => {
    const issues = await ctx.db.query.issues.findMany({});

    return {
      issues,
    };
  }),
  addIssue: publicProcedure.mutation(async ({ ctx }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({});

    if (canceled) return false;

    const wasmBinary = readFileSync(
      require.resolve("node_modules/node-unrar-js/dist/js/unrar.wasm"),
    );
    const file = readFileSync(filePaths[0]);

    console.log(file);

    const extractor = await createExtractorFromData({
      data: Uint8Array.from(file).buffer,
      wasmBinary,
    });

    const extracted = extractor.extract({
      files: [...extractor.getFileList().fileHeaders].map((v) => v.name),
    });

    console.log({ extracted });

    console.log({ canceled, filePaths });
  }),
});

export default issueRouter;
