import { prefetchWorkerSchema } from "@shared/core/validations";
import type { issues as issueSchema } from "@shared/schema";
import db from "@src/shared/storage";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { BroadcastChannel } from "broadcast-channel";
import { Array, Effect, Match } from "effect";
import { parentPort } from "node:worker_threads";

const port = parentPort;

const prefetchChannel = new BroadcastChannel<PrefetchChannel>(
  "prefetch-channel",
  {},
);

if (!port) throw new Error("Illegal State");

function prefetchData({ view, issueId }: PrefetchSchema) {
  return Effect.gen(function* () {
    Match.value(view).pipe(
      Match.when("library", () => resolveLibrary()),
      Match.when("reader", () => resolvePages(issueId)),
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

const resolveLibrary = () =>
  Effect.gen(function* () {
    const collections = yield* Effect.tryPromise(
      async () =>
        await db.query.collections.findMany({
          with: {
            issues: true,
          },
        }),
    );

    const issues = yield* Effect.tryPromise(
      async () => await db.query.issues.findMany({}),
    ).pipe(
      Effect.map((issues) =>
        Array.differenceWith<typeof issueSchema.$inferSelect>(
          (a, b) => a.issueTitle === b.issueTitle,
        )(
          issues,
          collections.flatMap((c) => c.issues),
        ),
      ),
    );

    console.log({ issues, collections });

    prefetchChannel.postMessage({
      view: "library",
      data: {
        issues,
        collections,
      },
    });
  }).pipe(
    Effect.orDie,
    Effect.withLogSpan("prefetch.library"),
    Effect.annotateLogs({
      worker: "prefetch",
    }),
    Effect.runPromise,
  );

const resolvePages = (issueId: string | undefined) =>
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

    console.log(pages);

    prefetchChannel.postMessage({
      view: "reader",
      data: {
        pages,
      },
    });
  }).pipe(
    Effect.orDie,
    Effect.withLogSpan("prefetch.reader"),
    Effect.annotateLogs({
      worker: "prefetch",
    }),
    Effect.runPromise,
  );
