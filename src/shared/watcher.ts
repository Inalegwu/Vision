import chokidar from "chokidar";
import { fileAddEvent } from "./events";

export default function watchFS(path: string | null) {
  console.log("starting file watcher...");
  console.log(path);
  if (path === null) return;

  const watcher = chokidar.watch(path, {
    // ignored: /.*?(?<!\.(cbr|cbz))$/,
  });

  watcher.on("add", (p, s) => {
    console.log({ p, ...s });
    fileAddEvent.fire();
  });
}
