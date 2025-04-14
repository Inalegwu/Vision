import { publicProcedure, router } from "@src/trpc";
import { observable } from "@trpc/server/observable";
import { nativeTheme } from "electron";

export const os = router({
  getTheme: publicProcedure.subscription(() =>
    observable<ThemeSubscription>((emit) => {
      nativeTheme.on("updated", () => {});
    }),
  ),
});
