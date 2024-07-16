import { z } from "zod";

export const parsePathSchema = z.object({
  parsePath: z.string(),
  action: z.enum(["LINK", "UNLINK"]),
});

export const parseWorkerResponse = z.object({
  completed: z.boolean(),
  message: z.string().nullable(),
});

export const deletionWorkerSchema = z.object({
  issueId: z.string(),
});

export const deletionWorkerResponse = z.object({
  completed: z.boolean(),
  message: z.string().nullable(),
});
