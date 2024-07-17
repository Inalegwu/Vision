import type { collections, issues, pages } from "./schema";

type User = {
  id: string;
};

export type GlobalState = {
  colorMode: "dark" | "light";
  firstLaunch: boolean;
  sourceDir: string | null;
  user: User | null;
};

export type Issue = Omit<
  Omit<typeof issues.$inferSelect, "dateCreated">,
  "dateUpdated"
> & {
  dateCreated: string | null;
  dateUpdated: string | null;
};
export type Collection = typeof collections.$inferSelect;
export type Page = typeof pages.$inferSelect;

export type ParserResponse = {
  completed: boolean;
};

export type ParserErrorResponse = ParserResponse & {
  message: string;
};

export type ReadingIssue = Issue & {
  pageNumber: number;
  totalPages: number;
};

export type ReadingState = {
  currentlyReading: Set<ReadingIssue> | null;
  doneReading: Set<Issue> | null;
};

export type SelectedIssueState = {
  pages: Page[] | null;
};
