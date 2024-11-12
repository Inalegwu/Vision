import type { collections, issues, pages } from "./schema";

export type GlobalState = {
  colorMode: "dark" | "light";
  firstLaunch: boolean;
  isFullscreen: boolean;
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

type Reading = {
  id: string;
  title: string;
  thumbnailUrl: string;
};

export type DoneReading = Reading & {
  dateFinished: string;
};

export type CurrentlyReading = Reading & {
  currentPage: number;
  totalPages: number;
};

export type ReadingState = {
  doneReading: Map<string, DoneReading>;
  currentlyReading: Map<string, CurrentlyReading>;
};

export type ParserChannel = {
  completed?: number;
  total?: number;
  error: unknown | null;
  isCompleted?: boolean;
};

export type DeletionChannel = {
  isDone: boolean;
};
