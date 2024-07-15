import { relations } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { issues } from "./issue.schema";

export const collections = sqliteTable(
  "collections",
  {
    id: text("id").notNull().primaryKey(),
    collectionName: text("collection_name").notNull().unique(),
  },
  (table) => ({
    idIndex: index("collection_id_index").on(table.id),
  }),
);

export const collectionToIssue = relations(collections, ({ many }) => ({
  issues: many(issues),
}));
