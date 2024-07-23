import type { collections, issues, pages } from "./schema";

export type GlobalState = {
  colorMode: "dark" | "light";
  firstLaunch: boolean;
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

export type ReadingIssue = {
  issueId: string;
  thumbnailUrl: string;
  issueTitle: string;
  pageNumber: number;
  totalPages: number;
};

export type DoneIssue = {
  issueId: string;
  thumbnailUrl: string;
  issueTitle: string;
  dateFinished: string;
};

export type ReadingState = {
  currentlyReading: Map<string, ReadingIssue>;
  doneReading: Map<string, DoneIssue>;
};
