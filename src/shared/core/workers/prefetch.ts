import {
  type PrefetchSchema,
  prefetchWorkerSchema,
} from "@shared/core/validations";
import { parentPort } from "node:worker_threads";
// import type { PrefetchChannel } from "@shared/types";
import db from "@src/shared/storage";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { BroadcastChannel } from "broadcast-channel";
import { Data, Micro } from "effect";

const port = parentPort;

const prefetchChannel = new BroadcastChannel<PrefetchChannel>(
  "prefetch-channel",
  {},
);

if (!port) throw new Error("Illegal State");

class PrefetchError extends Data.TaggedError("prefetch-error")<{
  cause: unknown;
}> {}

function prefetchData({ field }: Pick<PrefetchSchema, "field">) {
  return Micro.tryPromise({
    try: async () => {
      switch (field) {
        case "issues": {
          const issues = await db.query.issues.findMany();
          return {
            field: "issues",
            data: issues,
          };
        }
        case "library": {
          return {
            field: "library",
            data: [],
          };
        }
      }
    },
    catch: (cause) => new PrefetchError({ cause }),
  });
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(prefetchWorkerSchema, message).match(
    (data) =>
      Micro.runPromise(prefetchData(data)).then((result) => {
        if (!result) return;

        prefetchChannel.postMessage({
          field: result.field as "issues" | "library",
          data: result.data,
        });
      }),
    ({ message }) => {
      console.error({ message });
    },
  ),
);
