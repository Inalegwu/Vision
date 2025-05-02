import {
  parseFileNameFromPath,
  parseWorkerMessageWithSchema,
} from "@src/shared/utils";
import chokidar from "chokidar";
import { Chunk, Effect, Queue, Stream, pipe } from "effect";
import { parentPort } from "node:worker_threads";
import { sourceDirSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

type Task = {
  path: string;
  fileName: string;
  ext: "cbr" | "cbz" | "none";
};

const execute = Effect.fn(function* (chunk: Chunk.Chunk<Task>) {
  yield* chunk.pipe(Chunk.toReadonlyArray, Effect.forEach(Effect.log));
});

const takeBatch = (messageBox: Queue.Queue<Task>) =>
  pipe(
    messageBox.takeBetween(2, 5),
    // !IMPORTANT consider the necessity of timing out
    // Effect.timeout(Duration.seconds(10)),
    // Effect.retry({
    //   schedule: Schedule.exponential(Duration.seconds(2), 3),
    // }),
    Effect.withLogSpan("take-batch"),
  );

const handleBatch = (stream: Stream.Stream<Task>) =>
  pipe(
    stream,
    Stream.runCollect,
    Effect.flatMap(execute),
    Effect.withLogSpan("execute-batch"),
  );

const batch = (messageBox: Queue.Queue<Task>) =>
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

  const queue = yield* Queue.unbounded<Task>();

  yield* Effect.try(() =>
    chokidar.watch(message.sourceDirectory, {
      ignoreInitial: false,
      awaitWriteFinish: true,
    }),
  ).pipe(
    Effect.tap((watcher) =>
      watcher.on("add", (path) =>
        queue.unsafeOffer({
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

  yield* batch(queue);
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
