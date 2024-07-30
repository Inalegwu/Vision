import chokidar from "chokidar";
import type z from "zod";
import type { parsePathSchema } from "./validations";
import parseWorker from "./workers/parser?nodeWorker";

export default function watchFS(path: string | null) {
  try {
    if (path === null) return;

    const watcher = chokidar.watch(path, {
      // ignored: /.*?(?<!\.(cbr|cbz))$/,
      ignoreInitial: true,
    });

    watcher.on("add", (p) => {
      console.log({ message: "spinning up new worker" });
      parseWorker({ name: `parse-worker-${p}` })
        .on("message", (e) => {
          console.log(e);
        })
        .postMessage({
          parsePath: p,
          action: "LINK",
        } satisfies z.infer<typeof parsePathSchema>);
    });

    watcher.on("unlink", (p) => {
      parseWorker({ name: `parse-worker-${p}` })
        .on("messae", (e) => {
          console.log({ e });
        })
        .postMessage({
          parsePath: p,
          action: "UNLINK",
        } satisfies z.infer<typeof parsePathSchema>);
    });
  } catch (e) {
    console.log({ e });
  }
}
