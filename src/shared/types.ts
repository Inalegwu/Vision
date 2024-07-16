import type { collections, issues, pages } from "./schema";

export type GlobalState = {
  colorMode: "dark" | "light";
  firstLaunch: boolean;
  sourceDir: string | null;
};

export type Issue = Omit<
  Omit<Omit<typeof issues.$inferSelect, "dateCreated">, "dateUpdated">,
  "thumbnailUrl"
>;
export type Collection = typeof collections.$inferSelect;
export type Page = typeof pages.$inferSelect;
