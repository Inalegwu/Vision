import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { eq } from "drizzle-orm";
import { Micro } from "effect";
import { parentPort } from "node:worker_threads";
import { issues } from "../../schema";
import db from "../../storage";
import { deletionWorkerSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

class DeletionError {
  readonly _tag = "DeletionError";

  constructor(readonly cause: unknown) {}
}

function deleteIssue(id: string) {
  return Micro.tryPromise({
    try: async () => {
      return await db.delete(issues).where(eq(issues.id, id));
    },
    catch: (cause: unknown) => new DeletionError({ cause }),
  });
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(deletionWorkerSchema, message).match(
    (data) =>
      Micro.runPromise(deleteIssue(data.data.issueId)).then((result) => {
        console.log(result);
      }),
    (message) => {
      console.error({ message });
    },
  ),
);
