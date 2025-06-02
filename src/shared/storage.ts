import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as Effect from "effect/Effect";
import * as Fn from "effect/Function";
import * as schema from "./schema";

const db = Fn.pipe(
  new Database(import.meta.env.DEV ? "vision.db" : process.env.db_url!, {
    fileMustExist: false,
  }),
  (client) => drizzle(client, { schema }),
);

Effect.try(() => migrate(db, { migrationsFolder: "drizzle/" })).pipe(
  Effect.catchTag("UnknownException", (e) => Effect.logFatal(e)),
  Effect.annotateLogs({
    module: "storage.migrate",
  }),
  Effect.runSync,
);

export default db;
