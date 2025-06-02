import chokidar from "chokidar";
import { app } from "electron";
import { writeFileSync } from "node:fs";
import { parentPort } from "node:worker_threads";
import { z } from "zod";
import { parseWorkerMessageWithSchema } from "../utils";
import watcherIndex from "./indexer";
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

const addFile = (p: string) => {
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
        .on("add", addFile),
    (error) => console.error({ error }),
  ),
);
