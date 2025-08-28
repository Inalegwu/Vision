import { deletionWorkerSchema } from "@shared/core/validations";
import { issues } from "@shared/schema";
import db from "@shared/storage";
import { deletionChannel } from "@src/shared/channels";
import { Fs } from "@src/shared/fs";
import { transformMessage } from "@src/shared/utils";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { parentPort } from "node:worker_threads";

const port = parentPort;

if (!port) throw new Error("Illegal State");

const deleteIssue = Effect.fnUntraced(function* ({ issueId }: DeletionSchema) {
  const issue = yield* Effect.tryPromise(
    async () =>
      await db.query.issues.findFirst({
        where: (fields, { eq }) => eq(fields.id, issueId),
      }),
  );

  if (!issue) {
    deletionChannel.postMessage({
      isDone: false,
    });
    return;
  }

  deletionChannel.postMessage({
    isDone: false,
    title: issue.issueTitle,
  });

  yield* Fs.removeDirectory(issue.path).pipe(
    Effect.catchTag("FSError", (error) =>
      Effect.succeed(
        deletionChannel.postMessage({
          isDone: false,
          title: issue.issueTitle,
          error: error.message,
        }),
      ),
    ),
  );

  yield* Effect.tryPromise(
    async () =>
      await db.delete(issues).where(eq(issues.id, issue.id)).returning(),
  );

  deletionChannel.postMessage({
    isDone: true,
    title: issue.issueTitle,
  });
});

port.on("message", (message) =>
  transformMessage(deletionWorkerSchema, message).pipe(
    Effect.matchEffect({
      onSuccess: (data) => deleteIssue(data),
      onFailure: Effect.logFatal,
    }),
    Effect.runPromise,
  ),
);
