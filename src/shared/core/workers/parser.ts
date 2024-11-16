import { Archive } from "@shared/core/archive";
import { type ParserSchema, parserSchema } from "@shared/core/validations";
import { parseWorkerMessageWithSchema } from "@shared/utils";
import { Data, Micro } from "effect";
import { parentPort } from "node:worker_threads";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

class ParserError extends Data.TaggedError("parser-error")<{
  cause: unknown;
}> {}

function handleMessage({ action, parsePath }: ParserSchema) {
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
    catch: (cause) => new ParserError({ cause: cause }),
  }).pipe(Micro.tapError((error) => Micro.sync(() => console.log(error))));
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(parserSchema, message).match(
    (data) => Micro.runPromise(handleMessage(data)),
    (message) => {
      console.error({ message });
    },
  ),
);
