import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import { createStore } from "tinybase/with-schemas";
import * as schema from "./schema";

const sqlite = new Database("vision.db");
const db = drizzle(sqlite, { schema });

export const readingStateStore = createStore().setTablesSchema({
  doneReading: {
    issueId: {
      type: "string",
    },
    issueTitle: {
      type: "string",
    },
    dateCompleted: {
      type: "string",
    },
    thumbnailUrl: {
      type: "string",
    },
  },
  currentlyReading: {
    issueId: {
      type: "string",
    },
    issueTitle: {
      type: "string",
    },
    pageNumber: {
      type: "number",
    },
    totalPages: {
      type: "number",
    },
    thumbnailUr: {
      type: "string",
    },
  },
});

const persister = createIndexedDbPersister(
  readingStateStore,
  "readingStateStore",
);

await persister.save();
await persister.startAutoSave();
await persister.startAutoLoad();

migrate(db, { migrationsFolder: "drizzle" });

export default db;
