import { eq } from "drizzle-orm";
import { parentPort } from "node:worker_threads";
import { issues } from "../../schema";
import db from "../../storage";
import { deleteFromStoreCompletionEvent$ } from "../events";
import { deletionWorkerSchema } from "../validations";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";

const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", (message) => parseWorkerMessageWithSchema(deletionWorkerSchema, message).match(async ({ data }) => {
  try {
    const start = Date.now();
    await db.delete(issues).where(eq(issues.id, data.issueId))
    deleteFromStoreCompletionEvent$.fire();

    console.log({ took: Date.now() - start })

  } catch (e) {
    console.error({ e });
  }
}, ({ message }) => {
  console.error({ message });
}))
