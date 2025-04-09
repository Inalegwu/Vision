import { Schema } from "effect";
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
});

// {
//   \"?xml\": \"\",
//   \"ComicInfo\": {
//     \"Series\": \"Green Lantern: Fractured Spectrum\",
//     \"Issue\": 1,
//     \"LanguageISO\": \"en\",
//     \"PageCount\": 29,
//     \"Notes\": \"Scraped metadata from Amazon [ASINB0DPV3BQXN]\",
//     \"writer\": \"Jeremy Adams\",
//     \"Month\": 1,
//     \"Year\": 2025
// }
// }
