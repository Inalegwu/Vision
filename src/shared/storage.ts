import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("vision.db");
const db = drizzle(sqlite, { schema });

export default db;
