import chokidar from "chokidar";

export default function watchFS(path: string | null) {
  console.log("starting file watcher...");
  console.log(path);
  if (path === null) return;

  const watcher = chokidar.watch(path, {
    // ignored: /.*?(?<!\.(cbr|cbz))$/,
  });

  watcher.on("add", (p, s) => {
    // TODO handle ignoring non .cbz and .cbr files and
    // extracting and serializing .cbz and .cbr files into Storage
    console.log({ p, ...s });
  });
}
