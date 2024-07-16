import chokidar from "chokidar";
import { parseWorkerResponse } from "./validations";
import ParserPath from "./workers/parser?nodeWorker";

const parseWorker = ParserPath({
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
    ignoreInitial: false,
  });

  watcher.on("add", (p, s) => {
    // TODO handle ignoring non .cbz and .cbr files and
    // extracting and serializing .cbz and .cbr files into Storage
    console.log({ p, ...s });
    parseWorker.postMessage({
      parsePath: p,
    });
  });
}
