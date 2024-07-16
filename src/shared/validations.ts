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

export const pagesWorkerSchema = z.object({
  issueId: z.string(),
});

export const pagesWorkerResponse = z.object({
  pages: z.array(
    z.object({
      id: z.string(),
      pageContent: z.string(),
      dateCreated: z.date().nullable(),
      dateUpdated: z.date().nullable(),
      issueId: z.string(),
    }),
  ),
  completed: z.boolean(),
});
