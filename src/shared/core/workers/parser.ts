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

const handleMessage = Effect.fn(function* ({
  action,
  parsePath,
}: ParserSchema) {
  const archive = yield* Archive;

  yield* Effect.logInfo({ action, parsePath });

  const ext = parsePath.includes("cbr")
    ? "cbr"
    : parsePath.includes("cbz")
      ? "cbz"
      : "none";

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
      archive.rar(parsePath).pipe(Effect.runPromise),
    ),
    Match.when({ action: "LINK", ext: "cbz" }, () =>
      archive.zip(parsePath).pipe(Effect.runPromise),
    ),
    Match.when({ action: "LINK", ext: "none" }, () => Effect.void),
    Match.when({ action: "UNLINK" }, () => Effect.void),
  );
});

port.on("message", (message) =>
  parseWorkerMessageWithSchema(parserSchema, message).match(
    (data) =>
      handleMessage(data).pipe(
        Effect.orDie,
        Effect.withLogSpan("parser.duration"),
        Effect.annotateLogs({
          worker: "parser-worker",
        }),
        Effect.provide(Archive.Default),
        Effect.runPromise,
      ),
    (message) => console.error({ message }),
  ),
);
