import {
  type DeletionSchema,
  deletionWorkerSchema,
} from "@shared/core/validations";
import { issues } from "@shared/schema";
import db from "@shared/storage";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { eq } from "drizzle-orm";
import { Micro } from "effect";
import { parentPort } from "node:worker_threads";

const port = parentPort;

if (!port) throw new Error("Illegal State");

class DeletionError {
  readonly _tag = "DeletionError";
  constructor(readonly cause: unknown) {}
}

function deleteIssue({ issueId }: DeletionSchema) {
  return Micro.tryPromise({
    try: async () => {
      return await db.delete(issues).where(eq(issues.id, issueId)).returning();
    },
    catch: (cause: unknown) => new DeletionError({ cause }),
  }).pipe(Micro.tapError((error) => Micro.sync(() => console.log(error))));
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(deletionWorkerSchema, message).match(
    (data) => Micro.runPromise(deleteIssue({ issueId: data.issueId })),
    (message) => {
      console.error({ message });
    },
  ),
);
