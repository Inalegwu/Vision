import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import chokidar from "chokidar";
import type * as Chunk from "effect/Chunk";
import * as Effect from "effect/Effect";
import * as Fn from "effect/Function";
import * as Match from "effect/Match";
import * as Queue from "effect/Queue";
import * as Stream from "effect/Stream";
import { parentPort } from "node:worker_threads";
import { Archive } from "../archive";
import { sourceDirSchema } from "../validations";
import { SharedMemory } from "./shared-memory";

const port = parentPort;

if (!port) throw new Error("Source Directory Watcher Process Port is Missing");

const execute = (tasks: Chunk.Chunk<Task>) =>
  Effect.forEach(
    tasks,
    (task) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(task);
        const archive = yield* Archive;

        Match.value(task.ext).pipe(
          Match.when("cbr", () => archive.rar(task.path)),
          Match.when("cbz", () => archive.zip(task.path)),
          Match.when("none", () => console.log("unknown file")),
          Match.exhaustive,
        );
      }).pipe(Effect.provide(Archive.Default)),
    {
      concurrency: "unbounded",
      batching: true,
    },
  );

const takeBatch = (queue: Queue.Queue<Task>) =>
  Fn.pipe(queue.takeBetween(2, 4));

const handleBatch = (stream: Stream.Stream<Task>) =>
  Fn.pipe(stream, Stream.runCollect, Effect.flatMap(execute));

const batch = (queue: Queue.Queue<Task>) =>
  Fn.pipe(
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
    Effect.map((watcher) =>
      watcher.on("add", (path) =>
        queue.unsafeOffer({
          ext: path.includes("cbr")
            ? "cbr"
            : path.includes("cbz")
              ? "cbz"
              : "none",
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
        Effect.withLogSpan("source-dir.duration"),
        Effect.annotateLogs({
          worker: "source-directory",
        }),
        Effect.orDie,
        Effect.scoped,
        Effect.runPromise,
      ),
    (message) => console.error({ message }),
  ),
);
