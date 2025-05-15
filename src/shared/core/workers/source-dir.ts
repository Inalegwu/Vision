import {
  parseFileNameFromPath,
  parseWorkerMessageWithSchema,
} from "@src/shared/utils";
import chokidar from "chokidar";
import { Chunk, Effect, Queue, Stream, pipe } from "effect";
import { parentPort } from "node:worker_threads";
import { sourceDirSchema } from "../validations";
import { SharedMemory } from "./shared-memory";

const port = parentPort;

if (!port) throw new Error("Source Directory Watcher Process Port is Missing");

const execute = Effect.fn(function* (chunk: Chunk.Chunk<Task>) {
  const tasks = Chunk.toReadonlyArray(chunk);
  yield* Effect.forEach(tasks, Effect.logInfo);
});

const takeBatch = (queue: Queue.Queue<Task>) =>
  pipe(queue.takeBetween(2, 5), Effect.withLogSpan("take-batch"));

const handleBatch = (stream: Stream.Stream<Task>) =>
  pipe(stream, Stream.runCollect, Effect.flatMap(execute));

const batch = (queue: Queue.Queue<Task>) =>
  pipe(
    takeBatch(queue),
    Stream.repeatEffect,
    Stream.filter((chunk) => chunk.length > 0),
    Stream.map(Stream.fromChunk),
    Stream.map(handleBatch),
    Stream.runDrain,
  );

const handleMessage = Effect.fn(function* (message: SourceDirSchema) {
  const _shared = yield* SharedMemory;

  yield* Effect.logInfo(message);

  _shared.saveToSharedMemory("cacheDir", message.cacheDirectory);
  _shared.saveToSharedMemory("sourceDir", message.sourceDirectory);

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
        Effect.provide(SharedMemory.Default),
        Effect.orDie,
        Effect.withLogSpan("source-dir.duration"),
        Effect.annotateLogs({
          worker: "source-directory",
        }),
        Effect.runPromise,
      ),
    (message) => console.error({ message }),
  ),
);
