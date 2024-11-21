import { Effect, Layer } from "effect";
import { app } from "electron";
import { ChokidarClient } from "../clients/chokidar";
import { PubSubClient } from "../pubsub/client";

const make = Effect.gen(function* () {
  const watcher = yield* ChokidarClient;

  const pubsub = yield* PubSubClient;

  yield* Effect.logInfo("watcher listening");

  yield* Effect.forkDaemon(
    Effect.forever(
      Effect.gen(function* () {
        yield* Effect.logInfo(`Documents`);
        const _ = yield* watcher.watch(`${app.getPath("documents")}/Vision`);
        _.on(
          "add",
          (path) => console.log(path),
          // Effect.runSync(
          //   Effect.gen(function* () {
          //     yield* pubsub.publish(
          //       Message.NewFile({
          //         path,
          //       }),
          //     );
          //   }),
          // ),
        );
      }),
    ),
  );
});

export const Watch = {
  Live: Layer.scopedDiscard(make).pipe(
    Layer.provide(ChokidarClient.live),
    Layer.provide(PubSubClient.Live),
  ),
};
