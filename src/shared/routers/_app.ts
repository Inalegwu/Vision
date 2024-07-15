import { router } from "@src/trpc";
import issueRouter from "./issue";
import libraryRouter from "./library";
import { windowRouter } from "./window";

export const appRouter = router({
  window: windowRouter,
  issue: issueRouter,
  library: libraryRouter,
});

export type AppRouter = typeof appRouter;
