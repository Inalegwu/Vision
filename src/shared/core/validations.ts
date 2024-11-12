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

export const metadataWorkerSchema = z.object({
  issueName: z.string(),
});

export const prefetchWorkerSchema = z.object({
  field: z.enum(["issues", "library"]),
});

export type ParserSchema = z.infer<typeof parserSchema>;
export type WorkerResponse = z.infer<typeof workerResponseSchema>;
export type DeletionSchema = z.infer<typeof deletionWorkerSchema>;
export type MetadataSchema = z.infer<typeof metadataWorkerSchema>;
export type PrefetchSchema = z.infer<typeof prefetchWorkerSchema>;
