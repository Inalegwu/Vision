import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createContext } from "@/shared/context";
import { appRouter } from "@/shared/routers/_app";
import { Effect, Match } from "effect";
import { pipe } from "effect/Function";
import { BrowserWindow, app, screen } from "electron";
import { createIPCHandler } from "electron-trpc/main";
import { deeplinkChannel } from "@/shared/channels";
import { Fs } from "@/shared/fs";
import { globalState$ } from "./web/state";

app.setName("Vision");

const data_dir = path.join(app.getPath("appData"), "Vision");

// unix systems don't create these on their own for some reason
// so much for the best operating system lol
Fs.makeDirectory(data_dir).pipe(
  Effect.catchTag("FSError", () => Effect.void),
  Effect.runPromise,
);
Fs.makeDirectory(path.join(data_dir, "LibraryCache")).pipe(
  Effect.catchTag("FSError", () => Effect.void),
  Effect.runPromise,
);
Fs.makeDirectory(path.join(data_dir, "Library")).pipe(
  Effect.catchTag("FSError", () => Effect.void),
  Effect.runPromise,
);

const downloads_dir = Match.value(process.platform).pipe(
  Match.when("linux", () => `${os.homedir()}/Downloads`),
  Match.when("darwin", () => `${os.homedir()}/Downloads`),
  Match.when("win32", () => `${os.homedir()}/downloads`),
  Match.orElse(() => `${os.homedir()}/Downloads`),
);

process.env.db_url = Match.value(process.platform).pipe(
  Match.when("linux", () => path.join(data_dir, "vision.db")),
  Match.orElse(() => path.join(data_dir, "vision.db")),
);
process.env.cache_dir = path.join(data_dir, "LibraryCache");
process.env.data_dir = data_dir;
process.env.source_dir = path.join(downloads_dir, "Comics");
process.env.lib_dir = path.join(data_dir, "Library");
process.env.error_dump = path.join(data_dir, "Vision", "ErrorDump.json");

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
  pipe(
    path.join(data_dir, "config.json"),
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
  pipe(
    path.join(data_dir, "config.json"),
    (path) => ({
      path,
      config: JSON.stringify(config),
    }),
    (_) => fs.writeFileSync(_.path, _.config, { encoding: "utf-8" }),
  );

  app.quit();
});
