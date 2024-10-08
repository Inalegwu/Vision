import chokidar from "chokidar";
import { app } from "electron";
import { writeFileSync } from "node:fs";
import type z from "zod";
import watcherIndex from "./indexer";
import type { parsePathSchema } from "./validations";
import parseWorker from "./workers/parser?nodeWorker";
import { err, ok } from "neverthrow";

export default function watchFS(path: string | null) {
  watcherIndex.load(`${app.getPath("appData")}/Vision/index.json`);
  try {
    if (path === null) return;

    const watcher = chokidar.watch(path, {
      ignoreInitial: true,
    });

    watcher.on("add", addFile);

    return ok({
      message: "started file watcher"
    })
  } catch (e) {
    console.log({ e });
    return err({
      error: `${e}`,
      message: "failed to start file watcher"
    })
  }
}

const addFile = (p: string) => {
  if (watcherIndex.checkIndex(p)) {
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
    } satisfies z.infer<typeof parsePathSchema>);
};

setInterval(() => {
  watcherIndex.saveIndex(
    `${app.getPath("appData")}/Vision/index.json`,
    writeFileSync,
  );
}, 10_000);
