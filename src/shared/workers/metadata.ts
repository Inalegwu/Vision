import { parentPort } from "node:worker_threads";
import { metadataWorkerSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", (e) => {
  const response = metadataWorkerSchema.safeParse(e);

  if (!response.success) {
    port.postMessage({
      message: "Invalid Data Sent",
      completed: false,
    });
    return;
  }

  console.log({ data: response.data });
});
