import { Effect, Layer, Match, Option } from "effect";
import { PubSubClient } from "../pubsub/client";

const make = Effect.gen(function* () {
  const pubsub = yield* PubSubClient;

  const sub = yield* pubsub.subscribeTo("NewFile");

  yield* Effect.forkScoped(
    Effect.forever(
      Effect.gen(function* () {
        const message = yield* sub.take;

        const _ = message.path;
        const [name, ext] = yield* Option.fromNullable(_.split("."));
        const fileName = yield* Option.fromNullable(
          name
            .replace(/^.*[\\\/]/, "")
            .replace(/\.[^/.]+$/, "")
            .replace(/(\d+)$/, "")
            .replace("-", ""),
        );

        const parsedXt = yield* Match.value(ext).pipe(
          Match.when("cbr", (ext) => Effect.succeed(ext)),
          Match.when("cbz", (ext) => Effect.succeed(ext)),
          Match.orElse(() => Option.none()),
        );
      }),
    ),
  );
});

export const Parse = {
  Live: Layer.scopedDiscard(make).pipe(Layer.provide(PubSubClient.Live)),
};
