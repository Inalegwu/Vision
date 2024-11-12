import {
  type PrefetchSchema,
  prefetchWorkerSchema,
} from "@shared/core/validations";
import db from "@src/shared/storage";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { Micro } from "effect";
import { parentPort } from "node:worker_threads";

const port = parentPort;

if (!port) throw new Error("Illegal State");

class PrefetchError {
  readonly _tag = "PrefetchError";
  constructor(readonly cause: unknown) {}
}

function prefetchData({ field }: Pick<PrefetchSchema, "field">) {
  return Micro.tryPromise({
    try: async () => {
      switch (field) {
        case "issues": {
          const issues = await db.query.issues.findMany();
          return issues;
        }
        case "library": {
          return;
        }
      }
    },
    catch: (cause) => new PrefetchError({ cause }),
  });
}

port.on("message", (m) =>
  parseWorkerMessageWithSchema(prefetchWorkerSchema, m).match(
    ({ data }) =>
      Micro.runPromise(prefetchData({ field: data.field })).then((result) => {
        port.postMessage({});
      }),
    ({ message }) => {
      console.error({ message });
    },
  ),
);
