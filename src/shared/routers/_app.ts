import parseWorker from "@core/workers/parser?nodeWorker";
import { publicProcedure, router } from "@src/trpc";
import { observable } from "@trpc/server/observable";
import { gte } from "drizzle-orm";
import { deeplinkChannel } from "../channels";
import { parseFileNameFromPath } from "../utils";
import { history } from "./history";
import issueRouter from "./issue";
import libraryRouter from "./library";
import oauthRouter from "./oauth";
import { windowRouter } from "./window";

export const appRouter = router({
  window: windowRouter,
  issue: issueRouter,
  library: libraryRouter,
  oauth: oauthRouter,
  history,
  deeplink: publicProcedure.subscription(({ ctx }) =>
    observable<{
      issueId: string;
    }>((emit) => {
      const listener = async (evt: DeeplinkChannel) => {
        const exists = await ctx.db.query.issues.findFirst({
          where: (fields, { eq }) =>
            gte(fields.issueTitle, parseFileNameFromPath(evt.path)),
          columns: {
            id: true,
          },
        });

        if (!exists) {
          parseWorker({
            name: `parse-worker-${evt.path}`,
          })
            .on("message", (m) => {
              console.log(m);
            })
            .postMessage({
              parsePath: evt.path,
              action: "LINK",
            } satisfies ParserSchema);
          return;
        }

        emit.next({
          issueId: exists.id,
        });
      };

      deeplinkChannel.addEventListener("message", listener);

      return () => {
        deeplinkChannel.removeEventListener("message", listener);
      };
    }),
  ),
});

export type AppRouter = typeof appRouter;
