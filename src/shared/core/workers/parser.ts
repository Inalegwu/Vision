import { parserSchema } from "@shared/core/validations";
import { parseWorkerMessageWithSchema } from "@shared/utils";
import { Effect, Match } from "effect";
import { parentPort } from "node:worker_threads";
import { Archive } from "../archive";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

function handleMessage({ action, parsePath }: ParserSchema) {
  return Effect.gen(function* () {
    const ext = parsePath.includes("cbr")
      ? "cbr"
      : parsePath.includes("cbz")
        ? "cbz"
        : "none";

    yield* Effect.logInfo({ ext, parsePath, action });

    Match.value({ action, ext }).pipe(
      Match.when({ action: "LINK", ext: "cbr" }, () =>
        Archive.handleRar(parsePath),
      ),
      Match.when({ action: "LINK", ext: "cbz" }, () =>
        Archive.handleZip(parsePath),
      ),
      Match.when({ action: "LINK", ext: "none" }, () => Effect.void),
      Match.when({ action: "UNLINK" }, () => Effect.void),
    );
  }).pipe(
    Effect.orDie,
    Effect.annotateLogs({
      worker: "parser",
    }),
    Effect.runPromise,
  );
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(parserSchema, message).match(
    (data) => handleMessage(data),
    (message) => {
      console.error({ message });
    },
  ),
);
