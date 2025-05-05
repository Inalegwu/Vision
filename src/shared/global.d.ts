import type {
  MetadataSchema,
  deletionWorkerSchema,
  parserSchema,
  prefetchWorkerSchema,
  sourceDirSchema,
  workerResponseSchema,
} from "@shared/core/validations";
import type * as Schema from "effect/Schema";
import type z from "zod";
import type { collections, issues, pages } from "./schema";

declare global {
  export type GlobalState = {
    colorMode: "dark" | "light";
    firstLaunch: boolean;
    isFullscreen: boolean;
    libraryView: "issues" | "collections";
  };

  export type Issue = Omit<
    typeof issues.$inferSelect,
    "dateCreated" | "dateUpdated"
  > & {
    dateCreated: string | null;
    dateUpdated: string | null;
  };

  export type Collection = Omit<
    typeof collections.$inferSelect,
    "dateCreated" | "dateUpdated"
  > & {
    dateCreated: string | null;
    dateUpdated: string | null;
  };

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
    error: string | null;
    isCompleted?: boolean;
    state: "ERROR" | "SUCCESS";
  };

  export type DeletionChannel = {
    isDone: boolean;
  };

  export type PrefetchChannel = {
    view: Pick<PrefetchSchema, "view">["view"];
    data: Record<string, unknown>;
  };

  export type Index = {
    index: Array<{
      path: string;
    }>;
  };

  export type ThemeSubscription = {
    theme: "dark" | "light";
  };

  export type Task = Readonly<{
    path: string;
    fileName: string;
    ext: "cbr" | "cbz" | "none";
  }>;

  export type ParserSchema = z.infer<typeof parserSchema>;
  export type WorkerResponse = z.infer<typeof workerResponseSchema>;
  export type DeletionSchema = z.infer<typeof deletionWorkerSchema>;
  export type PrefetchSchema = z.infer<typeof prefetchWorkerSchema>;
  export type Metadata = Schema.Schema.Type<typeof MetadataSchema>;
  export type SourceDirSchema = z.infer<typeof sourceDirSchema>;
}
