import { Fs } from "@src/shared/fs";
import db from "@src/shared/storage";
import { Duration, Effect, Mailbox, Schedule } from "effect";
import { parentPort } from "node:worker_threads";
import { z } from "zod";
import { parseFileNameFromPath, transformMessage } from "../../utils";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

const watchFS = Effect.fn(function* (directory: string | null) {
  const mailbox = yield* Mailbox.make<string>({
    strategy: "sliding",
    capacity: 200,
  });

  if (!directory) return;

  const files = yield* Fs.readDirectory(directory).pipe(
    Effect.map((files) => files.filter((file) => !file.isDirectory)),
    Effect.map((files) =>
      files.map((file) => parseFileNameFromPath(file.file)),
    ),
  );

  const unsavedIssues = yield* Effect.tryPromise(
    async () =>
      await db.query.issues.findMany({
        columns: {
          path: true,
        },
      }),
  ).pipe(
    Effect.map((issues) =>
      issues.map((issue) => parseFileNameFromPath(issue.path)),
    ),
    Effect.map((issues) =>
      files.filter((file) => !issues.find((issue) => issue === file)),
    ),
  );

  yield* mailbox.offerAll(unsavedIssues);
});

port.on("message", (message) =>
  transformMessage(z.object({ activate: z.boolean() }), message).pipe(
    Effect.matchEffect({
      onSuccess: ({ activate }) =>
        watchFS(process.env.source_dir!).pipe(
          Effect.schedule(Schedule.duration(Duration.seconds(10))),
          Effect.catchTags({
            FSError: (error) => Effect.logError(error.message),
            UnknownException: (exception) =>
              Effect.logFatal({
                message: exception.message,
                cause: exception.cause,
              }),
          }),
          Effect.forever,
        ),
      onFailure: Effect.logFatal,
    }),
    Effect.annotateLogs({
      worker: "watcher",
    }),
    Effect.runPromise,
  ),
);
