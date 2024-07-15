import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { app } from "electron";
import * as schema from "./schema";

// THIS IS A HACK
// this ensures that the application database
// is available when this file is instantiated
process.env = {
  DB_URL: `${app.getPath("appData")}/Vision/vision.db`,
};

const sqlite = new Database(process.env.DB_URL!);
const db = drizzle(sqlite, { schema });

export default db;
