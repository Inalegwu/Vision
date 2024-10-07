import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  blob,
} from "drizzle-orm/sqlite-core";

export const issues = sqliteTable("issues", {
  id: text("id").unique().notNull(),
  title: text("title").unique().notNull(),
  dateCreated: integer("dateCreated", {
    mode: "timestamp",
  }).$default(() => new Date()),
  dateUpdated: integer("dateUpdated", {
    mode: "timestamp",
  }).$default(() => new Date()),
});

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").unique().notNull(),
    issueId: text("issue_id").references(() => issues.id),
    data: blob("data", { mode: "buffer" }),
  },
  (table) => ({
    idIndex: uniqueIndex("attch_id_idx").on(table.id),
  }),
);
