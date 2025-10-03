import { Data, Effect, Encoding } from "effect";
import { Dump } from "./dump";

export class FSError extends Data.TaggedError("FSError")<{
  cause: unknown;
  message: string;
}> {}

export class ArchiveError extends Data.TaggedError("ArchiveError")<{
  cause: unknown;
}> {}

export class TaskError extends Data.TaggedError("TaskError")<{
  cause: unknown;
  message: string;
}> {}

export class DeletionError extends Data.TaggedError("DeletionError")<{
  cause: unknown;
}> {}

export const ApplicationError = Data.taggedEnum<
  TaskError | DeletionError | ArchiveError | FSError
>();

export type ApplicationError = typeof ApplicationError;

const ensureError = Effect.fn(function* (
  error: TaskError | DeletionError | ArchiveError | FSError,
) {
  const dump = yield* Dump;

  yield* Effect.logError(error);

  yield* dump
    .writeToDump({
      date: new Date(),
      error: JSON.stringify({
        message: error.message,
        cause: error.cause,
      }),
      id: Encoding.encodeBase64(`${error._tag}::${Date.now()}`),
    })
    .pipe(
      Effect.andThen(
        Effect.logInfo(`Error saved to dump @ ${process.env.error_dump}`),
      ),
    );
});

export const handleApplicationError = ApplicationError.$match({
  DeletionError: (error) =>
    ensureError(error).pipe(Effect.provide(Dump.Default)),
  ArchiveError: (error) =>
    ensureError(error).pipe(Effect.provide(Dump.Default)),
  TaskError: (error) => ensureError(error).pipe(Effect.provide(Dump.Default)),
  FSError: (error) => ensureError(error).pipe(Effect.provide(Dump.Default)),
});
