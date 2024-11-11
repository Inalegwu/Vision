import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { eq } from "drizzle-orm";
import { Micro } from "effect";
import { parentPort } from "node:worker_threads";
import { issues } from "../../schema";
import db from "../../storage";
import { deletionWorkerSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

class DeletionError extends Micro.TaggedError("deletion-error")<{
  cause: unknown;
}> {}

async function removeById(id: string) {
  return await db.delete(issues).where(eq(issues.id, id));
}

function deleteIssue(id: string) {
  return Micro.tryPromise({
    try: () => removeById(id),
    catch: (error) => new DeletionError({ cause: error }),
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
