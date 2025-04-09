import { deletionWorkerSchema } from "@shared/core/validations";
import { issues } from "@shared/schema";
import db from "@shared/storage";
import type { DeletionChannel } from "@src/shared/types";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { BroadcastChannel } from "broadcast-channel";
import { eq } from "drizzle-orm";
import { Data, Effect } from "effect";
import { parentPort } from "node:worker_threads";

const port = parentPort;

const deletionChannel = new BroadcastChannel<DeletionChannel>(
  "deletion-channel",
);

if (!port) throw new Error("Illegal State");

class DeletionError extends Data.TaggedError("deletion-error")<{
  cause: unknown;
}> {}

function deleteIssue({ issueId }: DeletionSchema) {
  return Effect.tryPromise({
    try: async () => {
      await db.delete(issues).where(eq(issues.id, issueId)).returning();
      deletionChannel.postMessage({
        isDone: true,
      });
      return;
    },
    catch: (cause: unknown) => new DeletionError({ cause }),
  }).pipe(
    Effect.orDie,
    Effect.annotateLogs({
      worker: "deletion",
    }),
    Effect.runPromise,
  );
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(deletionWorkerSchema, message).match(
    (data) => deleteIssue(data),
    (message) => {
      console.error({ message });
    },
  ),
);
