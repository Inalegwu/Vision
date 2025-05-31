import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const issues = sqliteTable(
  "issues",
  {
    id: text("id").notNull().primaryKey(),
    issueTitle: text("issue_title").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    path: text("path").notNull(),
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

export const metadata = sqliteTable("metadata", {
  id: text("id").notNull().primaryKey(),
  issueId: text("issueId").references(() => issues.id, {
    onDelete: "cascade",
  }),
  Series: text("series"),
  Issue: integer("issue"),
  Web: text("web"),
  LanguageISO: text("language"),
  PageCount: integer("page_count"),
  Notes: text("notes"),
  writer: text("writer"),
  Month: integer("month"),
  Year: integer("year"),
  Summary: text("summary"),
});

export const metaToIssue = relations(metadata, ({ one }) => ({
  issue: one(issues, {
    fields: [metadata.issueId],
    references: [issues.id],
  }),
}));

export const issueToMeta = relations(issues, ({ one }) => ({
  metadata: one(metadata),
}));
