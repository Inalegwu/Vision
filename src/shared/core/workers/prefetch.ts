import { prefetchWorkerSchema } from "@shared/core/validations";
import db from "@src/shared/storage";
import { parentPort } from "node:worker_threads";
// import type { PrefetchChannel } from "@shared/types";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { BroadcastChannel } from "broadcast-channel";
import { Effect, Match } from "effect";

const port = parentPort;

const prefetchChannel = new BroadcastChannel<PrefetchChannel>(
  "prefetch-channel",
  {},
);

if (!port) throw new Error("Illegal State");

function prefetchData({ view, issueId }: PrefetchSchema) {
  return Effect.gen(function* () {
    Match.value(view).pipe(
      Match.when("library", (view) =>
        Effect.gen(function* () {
          const issues = yield* Effect.tryPromise(
            async () => await db.query.issues.findMany({}),
          );
          const collections = yield* Effect.tryPromise(
            async () =>
              await db.query.collections.findMany({
                with: {
                  issues: {
                    columns: {
                      id: true,
                      thumbnailUrl: true,
                    },
                    orderBy: (fields, { desc }) => desc(fields.dateCreated),
                  },
                },
              }),
          );

          prefetchChannel.postMessage({
            view,
            data: {
              issues: issues.filter(
                (issue) =>
                  !collections.find((collection) =>
                    collection.issues.find((issueK) => issueK.id === issue.id),
                  ),
              ),
              collections,
            },
          });
        }),
      ),
      Match.when("reader", (view) =>
        Effect.gen(function* () {
          if (!issueId) {
            return yield* Effect.die(new Error("No Issue ID Given"));
          }

          const exists = yield* Effect.tryPromise(
            async () =>
              await db.query.issues.findFirst({
                where: (issue, { eq }) => eq(issue.id, issueId),
              }),
          );

          if (!exists) {
            return yield* Effect.die(
              new Error(`Couldn't Find Issue with ID: ${issueId}`),
            );
          }

          const pages = yield* Effect.tryPromise(
            async () =>
              await db.query.pages.findMany({
                where: (page, { eq }) => eq(page.issueId, issueId),
              }),
          );

          prefetchChannel.postMessage({
            view,
            data: {
              pages,
            },
          });
        }),
      ),
    );
  }).pipe(Effect.runPromise);
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(prefetchWorkerSchema, message).match(
    (data) => prefetchData(data),
    ({ message }) => {
      console.error({ message });
    },
  ),
);
