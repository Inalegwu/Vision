import { parentPort } from "node:worker_threads";
import { Micro } from "effect";
import type z from "zod";
import { parseWorkerMessageWithSchema } from "../../utils";
import { Archive } from "../archive";
import { parsePathSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

class ParserError {
  readonly _tag = "ParserError";
  constructor(readonly cause: unknown) {}
}

function handleMessage({ action, parsePath }: z.infer<typeof parsePathSchema>) {
  return Micro.tryPromise({
    try: async () => {
      switch (action) {
        case "LINK": {
          if (parsePath.includes("cbr")) {
            return (await Archive.handleRar(parsePath))
              ._unsafeUnwrap()
              ._unsafeUnwrap();
          }

          if (parsePath.includes("cbz")) {
            return (await Archive.handleZip(parsePath))
              ._unsafeUnwrap()
              ._unsafeUnwrap();
          }

          return;
        }
        case "UNLINK": {
          return;
        }
      }
    },
    catch: (cause) => new ParserError({ cause }),
  });
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(parsePathSchema, message).match(
    ({ data }) => Micro.runPromise(handleMessage(data)),
    (error) => {
      console.error(error);
    },
  ),
);
