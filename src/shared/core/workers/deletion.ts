import { deletionWorkerSchema } from "@shared/core/validations";
import { issues } from "@shared/schema";
import db from "@shared/storage";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { BroadcastChannel } from "broadcast-channel";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { parentPort } from "node:worker_threads";
import { DeletionError } from "../errors";

const port = parentPort;

const deletionChannel = new BroadcastChannel<DeletionChannel>(
  "deletion-channel",
);

if (!port) throw new Error("Illegal State");

const deleteIssue = ({ issueId }: DeletionSchema) =>
  Effect.tryPromise({
    try: async () => {
      await db.delete(issues).where(eq(issues.id, issueId)).returning();
      deletionChannel.postMessage({
        isDone: true,
      });
      return;
    },
    catch: (cause) => new DeletionError({ cause }),
  }).pipe(
    Effect.orDie,
    Effect.withLogSpan("deletion.duration"),
    Effect.annotateLogs({
      worker: "deletion",
    }),
    Effect.runPromise,
  );

port.on("message", (message) =>
  parseWorkerMessageWithSchema(deletionWorkerSchema, message).match(
    (data) => deleteIssue(data),
    (message) => {
      console.error({ message });
    },
  ),
);
