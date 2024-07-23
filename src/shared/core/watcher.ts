import chokidar from "chokidar";
import type z from "zod";
import { type parsePathSchema, parseWorkerResponse } from "./validations";
import Parser from "./workers/parser?nodeWorker";

const parseWorker = Parser({
  name: "parse_file_worker",
});

parseWorker.on("message", (e) => {
  try {
    const response = parseWorkerResponse.safeParse(e);

    if (!response.success) {
      parseWorker.postMessage({
        errorMessage: "invalid response sent",
      });
      return;
    }
  } catch (e) {
    console.log({ e });
  }
});

export default function watchFS(path: string | null) {
  try {
    if (path === null) return;

    const watcher = chokidar.watch(path, {
      // ignored: /.*?(?<!\.(cbr|cbz))$/,
      ignoreInitial: false,
    });

    watcher.on("add", (p) => {
      parseWorker.postMessage({
        parsePath: p,
        action: "LINK",
      } satisfies z.infer<typeof parsePathSchema>);
    });

    watcher.on("unlink", (p) => {
      parseWorker.postMessage({
        parsePath: p,
        action: "UNLINK",
      } satisfies z.infer<typeof parsePathSchema>);
    });
  } catch (e) {
    console.log({ e });
  }
}
