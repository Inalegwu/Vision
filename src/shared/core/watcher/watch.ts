import { Duration, Effect, Layer, Schedule } from "effect";
import { ChokidarClient } from "../clients/chokidar";
import { PubSubClient } from "../pubsub/client";
import { Message } from "../pubsub/message";

const make = Effect.gen(function* () {
  const watcher = yield* ChokidarClient;

  const pubsub = yield* PubSubClient;

  yield* Effect.forkScoped(
    Effect.schedule(
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

        _.on("unlink", (path) =>
          Effect.runSync(
            Effect.gen(function* () {
              yield* pubsub.publish(
                Message.DeleteFile({
                  path,
                }),
              );
            }),
          ),
        );
      }),
      Schedule.duration(Duration.seconds(2)),
    ),
  );
});

export const Watch = {
  Live: Layer.scopedDiscard(make).pipe(
    Layer.provide(ChokidarClient.live),
    Layer.provide(PubSubClient.Live),
  ),
};
