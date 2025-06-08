import { Fs } from "@src/shared/fs";
import { collections, issues } from "@src/shared/schema";
import db from "@src/shared/storage";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { Effect } from "effect";
import { parentPort } from "node:worker_threads";
import { cacheWorkerSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", (message) =>
  parseWorkerMessageWithSchema(cacheWorkerSchema, message).match(
    () =>
      Fs.removeDirectory(process.env.cache_dir!).pipe(
        Effect.andThen(() =>
          Effect.tryPromise(async () => {
            await db.delete(issues);
            await db.delete(collections);
          }),
        ),
        Effect.orDie,
        Effect.runPromise,
      ),
    (message) => {
      console.error({ message });
    },
  ),
);
