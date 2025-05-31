import { relations } from "drizzle-orm";
import { date, index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const collections = pgTable(
  "collections",
  {
    id: varchar("id").notNull().primaryKey(),
    collectionName: varchar("collection_name").notNull().unique(),
    dateCreated: date("date_created").default(new Date().toString()),
    dateUpdated: date("date_udpdated").default(new Date().toString()),
  },
  (table) => ({
    idIndex: index("collection_id_index").on(table.id),
  }),
);

export const issues = pgTable(
  "issues",
  {
    id: varchar("id").notNull().primaryKey(),
    issueTitle: varchar("issue_title").notNull(),
    thumbnailUrl: varchar("thumbnail_url").notNull(),
    collectionId: varchar("collection_id").references(() => collections.id),
    dateCreated: date("date_created").default(new Date().toString()),
    dateUpdated: date("date_udpdated").default(new Date().toString()),
  },
  (table) => ({
    idIndex: index("issue_id_index").on(table.id),
  }),
);

export const metadata = pgTable("metadata", {
  id: varchar("id").notNull().primaryKey(),
  issueId: varchar("issueId").references(() => issues.id, {
    onDelete: "cascade",
  }),
  Series: varchar("series"),
  Issue: integer("issue"),
  Web: varchar("web"),
  LanguageISO: varchar("language"),
  PageCount: integer("page_count"),
  Notes: varchar("notes"),
  writer: varchar("writer"),
  Month: integer("month"),
  Year: integer("year"),
  Summary: varchar("summary"),
});

export const pages = pgTable(
  "pages",
  {
    id: varchar("id").notNull().primaryKey(),
    pageContent: varchar("page_content").notNull(),
    issueId: varchar("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    dateCreated: date("date_created").default(new Date().toString()),
    dateUpdated: date("date_udpdated").default(new Date().toString()),
  },
  (table) => ({
    pageIdIndex: index("page_id_index").on(table.id),
    issueIdIndex: index("page_issue_id_index").on(table.issueId),
  }),
);

export const collectionToIssue = relations(collections, ({ many }) => ({
  issues: many(issues),
}));

export const metaToIssue = relations(metadata, ({ one }) => ({
  issue: one(issues, {
    fields: [metadata.issueId],
    references: [issues.id],
  }),
}));

export const issueToMeta = relations(issues, ({ one }) => ({
  metadata: one(metadata),
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
