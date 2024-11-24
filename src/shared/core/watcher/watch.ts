import { Duration, Effect, Layer, Schedule } from "effect";
import { BroadcastClient } from "../clients/broadcast";
import { ChokidarClient } from "../clients/chokidar";
import { PubSubClient } from "../pubsub/client";
import { Message } from "../pubsub/message";

const make = Effect.gen(function* () {
  const watcher = yield* ChokidarClient;

  const broadCastClient = yield* BroadcastClient;
  const pubsub = yield* PubSubClient;

  const x = yield* broadCastClient.make<AddIssueChannel>("add-issue-channel");

  yield* Effect.forkScoped(
    Effect.schedule(
      Effect.gen(function* () {
        const _ = yield* watcher.watch("/home/disgruntleddev/Documents/Vision");
        _.on("add", (path) =>
          Effect.runSync(
            Effect.gen(function* () {
              yield* Effect.logInfo(path);

              yield* pubsub.publish(
                Message.NewFile({
                  path,
                }),
              );
            }),
          ),
        );

        x.addEventListener("message", ({ path }) => {
          Effect.runSync(
            Effect.gen(function* () {
              yield* Effect.forEach(path, (path) =>
                Effect.gen(function* () {
                  yield* pubsub.publish(
                    Message.NewFile({
                      path,
                    }),
                  );
                }),
              );
            }),
          );
        });

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
    Layer.provide(BroadcastClient.live),
  ),
};
