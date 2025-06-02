import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as Effect from "effect/Effect";
import * as Fn from "effect/Function";
import * as schema from "./schema";

const db = Fn.pipe(
  new Database(`${process.env.APPDATA}/vision/vision.db`, {
    fileMustExist: false,
  }),
  (client) => drizzle(client, { schema }),
);

Effect.try(() => migrate(db, { migrationsFolder: "drizzle/" })).pipe(
  Effect.catchTag("UnknownException", (e) => Effect.logFatal(e.error)),
  Effect.annotateLogs({
    module: "storage.migrate",
  }),
  Effect.runSync,
);

export default db;
