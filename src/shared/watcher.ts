import chokidar from "chokidar";
import { parseWorkerResponse } from "./validations";
import Parser from "./workers/parser?nodeWorker";

const parseWorker = Parser({
  name: "parse_file_worker",
});

parseWorker.on("message", (e) => {
  const response = parseWorkerResponse.safeParse(e);

  if (!response.success) {
    parseWorker.postMessage({
      errorMessage: "invalid response sent",
    });
    return;
  }
});

export default function watchFS(path: string | null) {
  if (path === null) return;

  console.log(path);

  const watcher = chokidar.watch(path, {
    // ignored: /.*?(?<!\.(cbr|cbz))$/,
    ignoreInitial: false,
  });

  watcher.on("add", (p, s) => {
    parseWorker.postMessage({
      parsePath: p,
      action: "LINK",
    });
  });

  watcher.on("unlink", (p) => {
    parseWorker.postMessage({
      parsePath: p,
      action: "UNLINK",
    });
  });
}
