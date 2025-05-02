import {
  parseFileNameFromPath,
  parseWorkerMessageWithSchema,
} from "@src/shared/utils";
import chokidar from "chokidar";
import { Effect, Mailbox, Stream, pipe } from "effect";
import { parentPort } from "node:worker_threads";
import { sourceDirSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

type Task = {
  path: string;
  fileName: string;
  ext: "cbr" | "cbz" | "none";
};

const takeBatch = (messageBox: Mailbox.Mailbox<Task>) =>
  pipe(
    messageBox.takeN(4),
    Effect.map(([maybeChunk]) => maybeChunk),
    Effect.withLogSpan("take-batch"),
  );

const handleBatch = (stream: Stream.Stream<Task>) =>
  pipe(
    stream,
    Stream.runCollect,
    Effect.flatMap((chunk) =>
      Effect.gen(function* () {
        // TODO
        // yield* Effect.logInfo(chunk);
      }),
    ),
    Effect.withLogSpan("execute-batch"),
  );

const batch = (messageBox: Mailbox.Mailbox<Task>) =>
  pipe(
    takeBatch(messageBox),
    Stream.repeatEffect,
    Stream.filter((chunk) => chunk.length > 0),
    Stream.map(Stream.fromChunk),
    Stream.tap(handleBatch),
    Stream.runDrain,
  );

const handleMessage = Effect.fn(function* (message: SourceDirSchema) {
  yield* Effect.logInfo(message);

  const messageBox = yield* Mailbox.make<Task>({
    strategy: "dropping",
  });

  yield* Effect.try(() =>
    chokidar.watch(message.sourceDirectory, {
      ignoreInitial: false,
      awaitWriteFinish: true,
    }),
  ).pipe(
    Effect.tap((watcher) =>
      watcher.on("add", (path) =>
        messageBox.unsafeOffer({
          ext: path.includes("cbr")
            ? "cbr"
            : path.includes("cbz")
              ? "cbz"
              : "none",
          fileName: parseFileNameFromPath(path),
          path,
        }),
      ),
    ),
  );

  yield* batch(messageBox);
});

port.on("message", (message) =>
  parseWorkerMessageWithSchema(sourceDirSchema, message).match(
    (data) =>
      handleMessage(data).pipe(
        Effect.annotateLogs({
          worker: "source-directory",
        }),
        Effect.runPromise,
      ),
    (message) => console.error({ message }),
  ),
);
