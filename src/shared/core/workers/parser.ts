import { parserSchema } from "@shared/core/validations";
import {
  parseFileNameFromPath,
  parseWorkerMessageWithSchema,
} from "@shared/utils";
import db from "@src/shared/storage";
import { BroadcastChannel } from "broadcast-channel";
import { Effect, Match } from "effect";
import { parentPort } from "node:worker_threads";
import { Archive } from "../archive";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");

const handleMessage = ({ action, parsePath }: ParserSchema) =>
  Effect.gen(function* () {
    parserChannel.postMessage({
      isCompleted: false,
      state: "SUCCESS",
      error: null,
    });
    const ext = parsePath.includes("cbr")
      ? "cbr"
      : parsePath.includes("cbz")
        ? "cbz"
        : "none";

    yield* Effect.logInfo({ ext, parsePath, action });
    parserChannel.postMessage({
      isCompleted: false,
      state: "SUCCESS",
      error: null,
    });

    const exists = yield* Effect.tryPromise(
      async () =>
        await db.query.issues.findFirst({
          where: (issue, { eq }) =>
            eq(issue.issueTitle, parseFileNameFromPath(parsePath)),
        }),
    );

    if (exists) {
      parserChannel.postMessage({
        isCompleted: true,
        error: "Issue Already Exists",
        state: "ERROR",
      });
      return yield* Effect.logError(`${exists.issueTitle} Already Saved`);
    }

    parserChannel.postMessage({
      isCompleted: false,
      state: "SUCCESS",
      error: null,
    });

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
      worker: `parser-${parsePath}`,
    }),
    Effect.runPromise,
  );

port.on("message", (message) =>
  parseWorkerMessageWithSchema(parserSchema, message).match(
    (data) => handleMessage(data),
    (message) => {
      console.error({ message });
    },
  ),
);
