import type { attachments, issues } from "./schema";

export type GlobalState = {
  colorMode: "dark" | "light" | "system";
  firstLaunch: boolean;
  fullscreen: boolean;
};

export type InsertAttachment = typeof attachments.$inferInsert;
export type SelectAttachment = typeof attachments.$inferSelect;
export type InsertIssue = typeof issues.$inferInsert;
export type SelectIssue = typeof issues.$inferSelect;
