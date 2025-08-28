import { createContext } from "@shared/context";
import { appRouter } from "@shared/routers/_app";
import * as Fn from "effect/Function";
import { BrowserWindow, app, screen } from "electron";
import { createIPCHandler } from "electron-trpc/main";
import * as fs from "node:fs";
import path from "node:path";
import { deeplinkChannel } from "./shared/channels";
import { globalState$ } from "./web/state";

app.setName("Vision");

process.env.db_url = path.join(app.getPath("appData"), "vision", "vision.db");
process.env.cache_dir = path.join(
  app.getPath("appData"),
  "vision",
  "LibraryCache",
);
process.env.source_dir = path.join(app.getPath("downloads"), "comics");
process.env.lib_dir = path.join(app.getPath("appData"), "Vision");

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
      _.preventDefault();
      if (mainWindow) {
        if (mainWindow.isMaximized()) mainWindow.restore();
        mainWindow.focus();
        const path = command.pop();

        if (!path) return;

        console.log({ path });

        deeplinkChannel.postMessage({
          path,
        });
      }
    });
  }

  // load app settings
  Fn.pipe(
    path.join(app.getPath("appData"), "Vision", "config.json"),
    (_) => fs.readFileSync(_, { encoding: "utf-8" }),
    (_) => JSON.parse(_) as GlobalState,
    globalState$.set,
  );

  // mainWindow.webContents.openDevTools({ mode: "detach" });
};

app.whenReady().then(() => createWindow());

app.once("window-all-closed", () => {
  const config = globalState$.get();

  // save app settings to disk
  Fn.pipe(
    path.join(app.getPath("appData"), "Vision", "config.json"),
    (path) => ({
      path,
      config: JSON.stringify(config),
    }),
    (_) => fs.writeFileSync(_.path, _.config, { encoding: "utf-8" }),
  );

  app.quit();
});
