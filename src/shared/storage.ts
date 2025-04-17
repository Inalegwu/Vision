import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { Effect } from "effect";
import * as schema from "./schema";

const client = new Database("vision.db");
const db = drizzle(client, { schema });

Effect.try(() => migrate(db, { migrationsFolder: "drizzle" })).pipe(
  Effect.catchTag("UnknownException", (e) => Effect.logFatal({ e })),
  Effect.annotateLogs({
    module: "storage.migrate",
  }),
  Effect.runSync,
);

export default db;
