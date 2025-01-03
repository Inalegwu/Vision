import { createContext } from "@shared/context";
import { appRouter } from "@shared/routers/_app";
import { BrowserWindow, app, screen } from "electron";
import { createIPCHandler } from "electron-trpc/main";
import { join } from "node:path";
import coreWorker from "./shared/core/core.ts?nodeWorker";

// THIS IS A HACK
// this ensures that the application database
// is available when this file is instantiated
process.env = {
  DB_URL: `${app.getPath("appData")}/Vision/vision.db`,
};

app.setName("Vision");

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const mainWindow = new BrowserWindow({
    frame: false,
    show: false,
    width: width - 50,
    height: height - 50,
    minWidth: width - 50,
    minHeight: height - 50,
    webPreferences: {
      sandbox: false,
      preload: join(__dirname, "../preload/preload.js"),
    },
  });

  coreWorker({
    name: "worker-worker",
  }).postMessage({
    path: `${app.getPath("documents")}/Vision`,
  });

  global.__path = `${app.getPath("documents")}/Vision`;

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
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  // mainWindow.webContents.openDevTools({ mode: "right" });
};

app.whenReady().then(() => {
  createWindow();
});

app.once("window-all-closed", () => app.quit());
