import { router } from "@src/trpc";
import issueRouter from "./issue";
import libraryRouter from "./library";
import oauthRouter from "./oauth";
import { windowRouter } from "./window";

export const appRouter = router({
  window: windowRouter,
  issue: issueRouter,
  library: libraryRouter,
  oauth: oauthRouter,
});

export type AppRouter = typeof appRouter;
