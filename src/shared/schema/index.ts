import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const collections = sqliteTable(
  "collections",
  {
    id: text("id").notNull().primaryKey(),
    collectionName: text("collection_name").notNull().unique(),
    dateCreated: integer("date_created", {
      mode: "timestamp",
    }).default(new Date()),
    dateUpdated: integer("date_udpdated", {
      mode: "timestamp",
    }).default(new Date()),
  },
  (table) => ({
    idIndex: index("collection_id_index").on(table.id),
  }),
);

export const issues = sqliteTable(
  "issues",
  {
    id: text("id").notNull().primaryKey(),
    issueTitle: text("issue_title").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    collectionId: text("collection_id").references(() => collections.id),
    dateCreated: integer("date_created", {
      mode: "timestamp",
    }).default(new Date()),
    dateUpdated: integer("date_udpdated", {
      mode: "timestamp",
    }).default(new Date()),
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
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id,{onDelete:"cascade"}),
    dateCreated: integer("date_created", {
      mode: "timestamp",
    }).default(new Date()),
    dateUpdated: integer("date_udpdated", {
      mode: "timestamp",
    }).default(new Date()),
  },
  (table) => ({
    pageIdIndex: index("page_id_index").on(table.issueId),
  }),
);

export const collectionToIssue = relations(collections, ({ many }) => ({
  issues: many(issues),
}));

export const issueToCollection = relations(issues, ({ one }) => ({
  collection: one(collections, {
    fields: [issues.collectionId],
    references: [collections.id],
  }),
}));

export const issueToPage = relations(issues, ({ many }) => ({
  pages: many(pages),
}));

export const pageToIssue = relations(pages, ({ one }) => ({
  issue: one(issues, {
    fields: [pages.issueId],
    references: [issues.id],
  }),
}));
