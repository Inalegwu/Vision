import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const dbPath = import.meta.env.DEV
  ? "vision.db"
  : path.join(process.resourcesPath, "./vision.db");

const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export default db;
