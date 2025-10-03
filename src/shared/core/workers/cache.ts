import { deletionChannel } from "@shared/channels";
import { Fs } from "@src/shared/fs";
import { collections, issues } from "@src/shared/schema";
import db from "@src/shared/storage";
import { transformMessage } from "@src/shared/utils";
import { Effect } from "effect";
import { parentPort } from "node:worker_threads";
import { cacheWorkerSchema } from "../../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", (message) =>
  transformMessage(cacheWorkerSchema, message).pipe(
    Effect.match({
      onSuccess: () =>
        Fs.removeDirectory(process.env.cache_dir!).pipe(
          Effect.andThen(() =>
            Effect.tryPromise(async () => {
              await db.delete(issues);
              await db.delete(collections);
            }),
          ),
          Effect.catchTag("FSError", (error) =>
            Effect.succeed(
              deletionChannel.postMessage({
                isDone: false,
                error: error.message,
              }),
            ),
          ),
        ),
      onFailure: Effect.logFatal,
    }),
    Effect.orDie,
    Effect.runPromise,
  ),
);
