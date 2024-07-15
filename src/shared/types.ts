import type { collections, issues, pages } from "./schema";

export type GlobalState = {
  colorMode: "dark" | "light";
  sourceFolder: string | null;
};

export type Issue = typeof issues.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Page = typeof pages.$inferSelect;
