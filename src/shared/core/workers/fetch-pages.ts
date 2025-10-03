import { Fs } from "@src/shared/fs";
import db from "@src/shared/storage";
import { convertToImageUrl, transformMessage } from "@src/shared/utils";
import { Array, Effect, pipe } from "effect";
import * as fs from "node:fs";
import { parentPort } from "node:worker_threads";
import { v4 } from "uuid";
import { fetchPagesWorkerSchema } from "../../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

const fetchPages = Effect.fn(function* (data: FetchPagesWorkerSchema) {
  const issue = yield* Effect.tryPromise(
    async () =>
      await db.query.issues.findFirst({
        where: (fields, { eq }) => eq(fields.id, data.issueId),
      }),
  );

  if (!issue) {
    return yield* Effect.logError(
      `Couldn't find issue with ID ${data.issueId}`,
    );
  }

  const pages = pipe(
    yield* Fs.readDirectory(issue.path),
    Array.map((file) => ({
      id: v4(),
      data: convertToImageUrl(fs.readFileSync(file).buffer),
    })),
  );

  yield* Effect.logInfo(pages);

  yield* Effect.try(() =>
    port.postMessage({
      pages,
    } satisfies FetchPagesResponseSchema),
  );
});

port.on("message", (message) =>
  transformMessage(fetchPagesWorkerSchema, message).pipe(
    Effect.matchEffect({
      onFailure: Effect.logFatal,
      onSuccess: (data) => fetchPages(data),
    }),
  ),
);
