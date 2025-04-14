import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const client = new Database("vision.db");
const db = drizzle(client, { schema });

migrate(db, { migrationsFolder: "drizzle" });

export default db;
