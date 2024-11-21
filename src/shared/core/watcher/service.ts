import { Effect, Layer } from "effect";
import { Watch } from "./watch";

const make = Effect.gen(function* () {
  yield* Effect.logInfo("Starting File Watcher");

  yield* Effect.acquireRelease(Effect.logInfo("Watcher Started"), () =>
    Effect.logInfo("Watcher Stopped"),
  );
});

export const WatcherService = Layer.scopedDiscard(make).pipe(
  Layer.provide(Watch.Live),
);
