import { relations } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { collections } from "./collection.schema";

export const issues = sqliteTable(
  "issues",
  {
    id: text("id").notNull().primaryKey(),
    issueTitle: text("issue_title").notNull(),
    collectionId: text("collection_id").references(() => collections.id),
  },
  (table) => ({
    idIndex: index("issue_id_index").on(table.id),
  }),
);

export const pages = sqliteTable(
  "pages",
  {
    id: text("id").notNull().primaryKey(),
    pageContent: text("page_content").notNull(),
    issueId: text("page_id")
      .notNull()
      .references(() => issues.id),
  },
  (table) => ({
    pageIdIndex: index("page_id_index").on(table.issueId),
  }),
);

export const issueToPage = relations(issues, ({ many }) => ({
  pages: many(pages),
}));

export const pageToIssue = relations(pages, ({ one }) => ({
  page: one(issues),
}));

export const pageToCollection = relations(issues, ({ one }) => ({
  collection: one(collections, {
    fields: [issues.collectionId],
    references: [collections.id],
  }),
}));
