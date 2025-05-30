import * as Schema from "effect/Schema";
import { z } from "zod";

export const parserSchema = z.object({
  parsePath: z.string(),
  action: z.enum(["LINK", "UNLINK"]),
});

export const deletionWorkerSchema = z.object({
  issueId: z.string(),
});

export const workerResponseSchema = z.object({
  message: z.string(),
  completed: z.boolean(),
  error: z.unknown().nullable(),
});

export const view = z.enum(["library", "reader"]);

export const prefetchWorkerSchema = z.object({
  view,
  issueId: z.optional(z.string()),
});

export const MetadataSchema = Schema.Struct({
  Series: Schema.String.pipe(Schema.optional),
  Issue: Schema.Int.pipe(Schema.optional),
  Web: Schema.String.pipe(Schema.optional),
  LanguageISO: Schema.String.pipe(Schema.optional),
  PageCount: Schema.Int.pipe(Schema.optional),
  Notes: Schema.String.pipe(Schema.optional),
  writer: Schema.String.pipe(Schema.optional),
  Month: Schema.Int.pipe(Schema.optional),
  Year: Schema.Int.pipe(Schema.optional),
  Summary: Schema.String.pipe(Schema.optional),
});

export const sourceDirSchema = z.object({
  sourceDirectory: z.array(z.string()),
  cacheDirectory: z.string(),
});
