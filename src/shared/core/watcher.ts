import chokidar from "chokidar";
import { app } from "electron";
import { writeFileSync } from "node:fs";
import type z from "zod";
import watcherIndex from "./indexer";
import type { parsePathSchema } from "./validations";
import parseWorker from "./workers/parser?nodeWorker";

export default function watchFS(path: string | null) {
  try {
    if (path === null) return;

    const watcher = chokidar.watch(path, {
      // ignored: /.*?(?<!\.(cbr|cbz))$/,
      ignoreInitial: true,
    });

    watcher.on("add", addFile);
  } catch (e) {
    console.log({ e });
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
