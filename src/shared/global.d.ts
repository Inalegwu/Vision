import type {
  MetadataSchema,
  cacheWorkerSchema,
  deletionWorkerSchema,
  fetchPagesResponseSchema,
  fetchPagesWorkerSchema,
  parserSchema,
  workerResponseSchema,
} from "@shared/core/validations";
import type * as Schema from "effect/Schema";
import type z from "zod";
import type { collections, issues } from "./schema";

declare global {
  export type GlobalState = {
    colorMode: "dark" | "light";
    firstLaunch: boolean;
    isFullscreen: boolean;
    libraryView: "issues" | "collections";
    appId: string | null;
    reader: {
      direction: "horizontal" | "vertical";
    };
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
    title?: string;
    error?: string | null;
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
    ext: "cbr" | "cbz" | "none";
  }>;

  export type DeeplinkChannel = {
    path: string;
  };

  export type Extractor = {
    name: string;
    isDir: boolean;
    data: ArrayBufferLike | undefined;
  };

  export type ParserSchema = z.infer<typeof parserSchema>;
  export type WorkerResponse = z.infer<typeof workerResponseSchema>;
  export type DeletionSchema = z.infer<typeof deletionWorkerSchema>;
  export type Metadata = Schema.Schema.Type<typeof MetadataSchema>;
  export type CacheWorkerSchema = z.infer<typeof cacheWorkerSchema>;
  export type FetchPagesWorkerSchema = z.infer<typeof fetchPagesWorkerSchema>;
  export type FetchPagesResponseSchema = z.infer<
    typeof fetchPagesResponseSchema
  >;
}
