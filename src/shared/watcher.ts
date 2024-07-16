import chokidar from "chokidar";
import { parseWorkerResponse } from "./validations";
import Parser from "./workers/parser?nodeWorker";

const parseWorker = Parser({
  name: "parse_file_worker",
});

parseWorker.on("message", (e) => {
  console.log(e);

  const response = parseWorkerResponse.safeParse(e);

  if (!response.success) {
    parseWorker.postMessage({
      errorMessage: "invalid response sent",
    });
    return;
  }

  console.log(response.data);
});

export default function watchFS(path: string | null) {
  console.log("starting file watcher...");
  console.log(path);
  if (path === null) return;

  const watcher = chokidar.watch(path, {
    // ignored: /.*?(?<!\.(cbr|cbz))$/,
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
