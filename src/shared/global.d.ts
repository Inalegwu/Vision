import type {
  deletionWorkerSchema,
  parserSchema,
  prefetchWorkerSchema,
  workerResponseSchema,
  MetadataSchema,
} from "@shared/core/validations";
import type z from "zod";
import type { collections, issues, pages } from "./schema";
import * as Schema from "effect/Schema"

declare global {
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
    error: string | null;
    isCompleted?: boolean;
  };

  export type DeletionChannel = {
    isDone: boolean;
  };

  export type PrefetchChannel = {
    view: Pick<PrefetchSchema, "view">["view"];
    data: Record<string, unknown>;
  };

  export type ParserSchema = z.infer<typeof parserSchema>;
  export type WorkerResponse = z.infer<typeof workerResponseSchema>;
  export type DeletionSchema = z.infer<typeof deletionWorkerSchema>;
  export type PrefetchSchema = z.infer<typeof prefetchWorkerSchema>;
  export type Metadata=Schema.Schema.Type<typeof MetadataSchema>
}
