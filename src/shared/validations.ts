import { z } from "zod";

export const parsePathSchema = z.object({
  parsePath: z.string(),
});

export const parseWorkerResponse = z.object({
  completed: z.boolean(),
  message: z.string().nullable(),
});
