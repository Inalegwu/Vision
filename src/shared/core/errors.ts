import { Data } from "effect";

export class ArchiveError extends Data.TaggedError("ArchiveError")<{
  cause: unknown;
}> {}

export class TaskError extends Data.TaggedError("TaskError")<{
  cause: unknown;
  message: string;
}> {}

export class DeletionError extends Data.TaggedError("deletion-error")<{
  cause: unknown;
}> {}
