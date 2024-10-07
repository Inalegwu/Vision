import { relations } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  blob,
} from "drizzle-orm/sqlite-core";

export const issues = sqliteTable(
  "issues",
  {
    id: text("id").unique().notNull(),
    title: text("title").unique().notNull(),
    dateCreated: integer("dateCreated", {
      mode: "timestamp",
    })
      .$default(() => new Date())
      .notNull(),
    dateUpdated: integer("dateUpdated", {
      mode: "timestamp",
    })
      .$default(() => new Date())
      .notNull(),
  },
  (table) => ({
    idIndex: uniqueIndex("issue_id_idx").on(table.id),
  }),
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").unique().notNull(),
    issueId: text("issue_id").references(() => issues.id),
    data: blob("data", { mode: "buffer" }),
    dateCreated: integer("date-created", {
      mode: "timestamp",
    })
      .$default(() => new Date())
      .notNull(),
    dateUpdated: integer("date-updated", {
      mode: "timestamp",
    })
      .$default(() => new Date())
      .notNull(),
  },
  (table) => ({
    idIndex: uniqueIndex("attch_id_idx").on(table.id),
  }),
);

export const attachmentIssue = relations(attachments, ({ one }) => ({
  issue: one(issues, {
    fields: [attachments.issueId],
    references: [issues.id],
  }),
}));

export const issueAttachment = relations(issues, ({ many }) => ({
  attachments: many(attachments),
}));
