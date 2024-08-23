import { parentPort } from "node:worker_threads";
import { deletionWorkerSchema } from "../validations";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";

const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", (message) => parseWorkerMessageWithSchema(deletionWorkerSchema, message).match(async ({ data }) => {
  try {
    const start = Date.now();
 
    console.log({ took: Date.now() - start })

  } catch (e) {
    console.error({ e });
  }
}, ({ message }) => {
  console.error({ message });
}))
