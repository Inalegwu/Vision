import { Effect, Layer, Match, Option } from "effect";
import { PubSubClient } from "../pubsub/client";
import { Message } from "../pubsub/message";

const make = Effect.gen(function* () {
  const pubsub = yield* PubSubClient;

  const sub = yield* pubsub.subscribeTo("NewFile");

  yield* Effect.forkScoped(
    Effect.forever(
      Effect.gen(function* () {
        const message = yield* sub.take;

        const _ = message.path;
        const [fileName, ext] = yield* Option.fromNullable(_.split("."));
        const name = yield* Option.fromNullable(
          fileName
            .replace(/^.*[\\\/]/, "")
            .replace(/\.[^/.]+$/, "")
            .replace(/(\d+)$/, "")
            .replace("-", ""),
        );

        yield* Match.value(ext).pipe(
          Match.when("cbr", () =>
            Effect.gen(function* () {
              yield* pubsub.publish(
                Message.NewRarFile({
                  path: message.path,
                  name,
                }),
              );
            }),
          ),
          Match.when("cbz", () =>
            Effect.gen(function* () {
              yield* pubsub.publish(
                Message.NewZipFile({
                  path: message.path,
                  name,
                }),
              );
            }),
          ),
          Match.orElse(() => Option.none()),
        );
      }),
    ),
  );
});

export const Parse = {
  Live: Layer.scopedDiscard(make).pipe(Layer.provide(PubSubClient.Live)),
};
