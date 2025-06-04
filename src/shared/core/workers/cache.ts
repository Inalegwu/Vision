import { Fs } from "@src/shared/fs";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { Effect } from "effect";
import { parentPort } from "node:worker_threads";
import { cacheWorkerSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", (message) =>
  parseWorkerMessageWithSchema(cacheWorkerSchema, message).match(
    (data) =>
      Fs.removeDirectory(process.env.cache_dir!).pipe(
        Effect.orDie,
        Effect.runPromise,
      ),
    (message) => {
      console.error({ message });
    },
  ),
);
