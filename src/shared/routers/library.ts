import { publicProcedure, router } from "@src/trpc";
import { globalState$ } from "@src/web/state";
import { dialog } from "electron";

const libraryRouter = router({
  addLibraryFolder: publicProcedure.mutation(async ({ ctx }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      defaultPath: `${ctx.app.getPath("downloads")}`,
      properties: ["openDirectory"],
    });

    if (canceled) {
      return false;
    }

    globalState$.sourceFolder.set(filePaths[0]);

    return true;
  }),
});

export default libraryRouter;
