import { type FSWatcher, watch as chokidarWatch } from "chokidar";
import { Context, Data, Effect, Layer } from "effect";
import type { UnknownException } from "effect/Cause";

class ChokidarError extends Data.TaggedError("chokidar-error")<{
  cause: unknown;
}> {}

type IChokidarClient = Readonly<{
  watch: (path: string) => Effect.Effect<FSWatcher, UnknownException>;
}>;

const make = Effect.gen(function* () {
  const watch = (path: string) =>
    Effect.try(() =>
      chokidarWatch(path, {
        ignoreInitial: true,
      }),
    );

  return { watch } satisfies IChokidarClient;
});

export class ChokidarClient extends Context.Tag("chokidar-client")<
  ChokidarClient,
  IChokidarClient
>() {
  static live = Layer.effect(this, make);
}
