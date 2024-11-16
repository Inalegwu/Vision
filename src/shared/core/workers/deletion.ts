import {
  type DeletionSchema,
  deletionWorkerSchema,
} from "@shared/core/validations";
import { issues } from "@shared/schema";
import db from "@shared/storage";
import type { DeletionChannel } from "@src/shared/types";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { BroadcastChannel } from "broadcast-channel";
import { eq } from "drizzle-orm";
import { Data, Micro } from "effect";
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
  return Micro.tryPromise({
    try: async () => {
      await db.delete(issues).where(eq(issues.id, issueId)).returning();
      deletionChannel.postMessage({
        isDone: true,
      });
      return;
    },
    catch: (cause: unknown) => new DeletionError({ cause }),
  }).pipe(Micro.tapError((error) => Micro.sync(() => console.log(error))));
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(deletionWorkerSchema, message).match(
    (data) => Micro.runPromise(deleteIssue(data)),
    (message) => {
      console.error({ message });
    },
  ),
);
