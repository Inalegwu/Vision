import { deletionWorkerSchema } from "@shared/core/validations";
import { issues } from "@shared/schema";
import db from "@shared/storage";
import { Fs } from "@src/shared/fs";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { BroadcastChannel } from "broadcast-channel";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { parentPort } from "node:worker_threads";

const port = parentPort;

const deletionChannel = new BroadcastChannel<DeletionChannel>(
  "deletion-channel",
);

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

  yield* Fs.removeDirectory(issue.path);

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
  parseWorkerMessageWithSchema(deletionWorkerSchema, message).match(
    (data) =>
      deleteIssue(data).pipe(
        Effect.orDie,
        Effect.withLogSpan("deletion.duration"),
        Effect.annotateLogs({
          worker: "deletion",
        }),
        Effect.runPromise,
      ),
    (message) => {
      console.error({ message });
    },
  ),
);
