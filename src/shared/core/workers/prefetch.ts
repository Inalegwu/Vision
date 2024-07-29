import { parentPort } from "node:worker_threads";
import { prefetchWorkerSchema } from "../validations";
import db from "@src/shared/storage";

const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", async (m) => {
  try {
    const parsedMessage = prefetchWorkerSchema.safeParse(m);

    if (!parsedMessage.success) {
      port.postMessage({
        completed: "false",
        message: "invalid message data send",
      });
      return;
    }

    
  } catch (e) {
    console.log({ e });
  }
});
