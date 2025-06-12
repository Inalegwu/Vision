import chokidar from "chokidar";
import { Effect } from "effect";
import { app } from "electron";
import { writeFileSync } from "node:fs";
import { parentPort } from "node:worker_threads";
import { z } from "zod";
import { parseWorkerMessageWithSchema } from "../utils";
import watcherIndex, { WatcherIndex } from "./indexer";
import parseWorker from "./workers/parser?nodeWorker";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

export default function watchFS(path: string | null) {
  try {
    if (path === null) return;

    const watcher = chokidar.watch(path);

    watcher.on("add", addFile);
  } catch (e) {
    console.log({ e });
  }
}

const addFile = Effect.fn(function* (path: string) {
  const index = yield* WatcherIndex;

  if (index.check(path)) {
    yield* Effect.logInfo(`Worker already running for ${path}`);
    return;
  }

  yield* Effect.logInfo("Spinning up new worker");

  index.write(path);

  parseWorker({
    name: `parse-worker-${path}`,
  })
    .on("message", console.log)
    .postMessage({
      parsePath: path,
      action: "LINK",
    } satisfies ParserSchema);

  return;
});

const _addFile = (p: string) => {
  if (watcherIndex.check(p)) {
    console.log({ message: "Worker already running for file" });
    return;
  }

  console.log({ message: "spinning up new worker" });
  watcherIndex.write(p);

  parseWorker({ name: `parse-worker-${p}` })
    .on("message", (e) => {
      console.log(e);
    })
    .postMessage({
      parsePath: p,
      action: "LINK",
    } satisfies ParserSchema);
};

setInterval(() => {
  watcherIndex.save(
    `${app.getPath("appData")}/Vision/index.json`,
    writeFileSync,
  );
}, 10_000);

port.on("message", (message) =>
  parseWorkerMessageWithSchema(z.object({}), message).match(
    () =>
      chokidar
        .watch(process.env.source_dir!, {
          awaitWriteFinish: true,
        })
        .on("add", (path) =>
          addFile(path).pipe(
            Effect.provide(WatcherIndex.Default),
            Effect.runSync,
          ),
        ),
    (error) => console.error({ error }),
  ),
);
