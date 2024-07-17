import { eq } from "drizzle-orm";
import { parentPort } from "node:worker_threads";
import { deleteFromStoreCompletionEvent$ } from "../events";
import { issues } from "../schema";
import db from "../storage";
import { deletionWorkerSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", async (e) => {
  try {
    const message = deletionWorkerSchema.safeParse(e);

    if (!message.success) {
      return {
        completed: false,
        message: "Invalid Schema",
      };
    }

    await db
      .delete(issues)
      .where(eq(issues.id, message.data.issueId))
      .returning();

    deleteFromStoreCompletionEvent$.fire();

    port.postMessage({
      completed: true,
      message: null,
    });
  } catch (e) {
    console.log({ e });
    port.postMessage({
      completed: false,
      message: "Error handling DB",
    });
  }
});
