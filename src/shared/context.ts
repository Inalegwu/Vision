import type { inferAsyncReturnType } from "@trpc/server";
import { BrowserWindow, app } from "electron";
import db from "./storage";

export async function createContext() {
  const browserWindow = BrowserWindow.getFocusedWindow();

  const appLaunchTime = Date.now();

  return {
    window: browserWindow,
    db,
    app,
    launchtime: appLaunchTime,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
