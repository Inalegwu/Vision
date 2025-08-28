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
    strategy: "dropping",
    capacity: 200,
  });

  if (!directory) return;

  console.log(`Launching watcher at directory ${directory}`);

  yield* Effect.logInfo(`Launching watcher @ directory ${directory}`);

  const files = yield* Fs.readDirectory(directory).pipe(
    Effect.map((files) => files.filter((file) => !file.isDirectory)),
    Effect.map((files) =>
      files.map((file) => parseFileNameFromPath(file.file)),
    ),
  );

  const issues = yield* Effect.tryPromise(
    async () =>
      await db.query.issues.findMany({
        columns: {
          issueTitle: true,
          path: true,
        },
      }),
  ).pipe(
    Effect.map((issues) =>
      issues.map((issue) => parseFileNameFromPath(issue.path)),
    ),
  );

  const unsaved = files.filter((file) => {
    if (issues.find((issue) => issue === file)) return false;

    return true;
  });

  yield* mailbox.offerAll(unsaved);
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
