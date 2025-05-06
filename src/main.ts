import sourceDirWatcherWorker from "@core/workers/source-dir?nodeWorker";
import { createContext } from "@shared/context";
import { appRouter } from "@shared/routers/_app";
import { pipe } from "effect";
import { BrowserWindow, app, screen } from "electron";
import { createIPCHandler } from "electron-trpc/main";
import * as fs from "node:fs";
import path from "node:path";
import { globalState$ } from "./web/state";

app.setName("Vision");

process.env = {
  DB_URL: path.join(app.getPath("appData"), "Vision", "vision.db"),
};

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("vision", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("vision");
}

const createWindow = () => {
  const instanceLock = app.requestSingleInstanceLock();

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWindow = new BrowserWindow({
    frame: false,
    show: false,
    width: width - 25,
    height: height - 25,
    minWidth: width - 25,
    minHeight: height - 25,
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  createIPCHandler({
    router: appRouter,
    windows: [mainWindow],
    createContext,
  });

  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.show();
  });

  if (import.meta.env.DEV) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  if (!instanceLock) {
    app.quit();
  } else {
    app.on("second-instance", (_, command, __) => {
      if (mainWindow) {
        if (mainWindow.isMaximized()) mainWindow.restore();
        mainWindow.focus();
        const url = command.pop();

        if (!url) return;

        console.log({ url });
      }
    });
  }

  pipe(
    path.join(app.getPath("appData"), "Vision", "config.json"),
    (_) => fs.readFileSync(_, { encoding: "utf-8" }),
    (_) => JSON.parse(_) as GlobalState,
    globalState$.set,
    (_) => console.log({ loadedConfig: _.get() }),
  );

  // mainWindow.webContents.openDevTools({ mode: "detach" });
};

app.whenReady().then(() => {
  // load saved config
  pipe(
    globalState$.get(),
    JSON.stringify,
    (config) => ({
      config,
      path: path.join(app.getPath("appData"), "Vision", "config.json"),
    }),
    (_) =>
      fs.writeFileSync(_.path, _.config, {
        encoding: "utf-8",
      }),
  );

  createWindow();
  sourceDirWatcherWorker({
    name: "source-dir-watcher",
  })
    .on("message", (message) => {
      console.log({ message });
    })
    .postMessage({
      sourceDirectory: [path.join(app.getPath("downloads"), "comics")],
      cacheDirectory: path.join(app.getPath("appData"), "Vision", "cache_data"),
    } satisfies SourceDirSchema);
});

app.once("window-all-closed", () => {
  const config = globalState$.get();

  pipe(
    path.join(app.getPath("appData"), "Vision", "config.json"),
    (path) => ({
      path,
      config: JSON.stringify(config),
    }),
    (_) => fs.writeFileSync(_.path, _.config, { encoding: "utf-8" }),
  );

  app.quit();
});
