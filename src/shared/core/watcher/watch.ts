import { Effect, Layer } from "effect";
import { ChokidarClient } from "../clients/chokidar";
import { PubSubClient } from "../pubsub/client";
import { Message } from "../pubsub/message";

const make = Effect.gen(function* () {
  const watcher = yield* ChokidarClient;

  const pubsub = yield* PubSubClient;

  yield* Effect.logInfo("watcher listening");

  yield* Effect.forkDaemon(
    Effect.forever(
      Effect.gen(function* () {
        const _ = yield* watcher.watch("/home/disgruntleddev/Documents/Vision");
        _.on("add", (path) =>
          Effect.runSync(
            Effect.gen(function* () {
              yield* pubsub.publish(
                Message.NewFile({
                  path,
                }),
              );
            }),
          ),
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
