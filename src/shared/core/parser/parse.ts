import { Effect, Layer, Option } from "effect";
import { PubSubClient } from "../pubsub/client";

const make = Effect.gen(function* () {
  const pubsub = yield* PubSubClient;

  const sub = yield* pubsub.subscribeTo("NewFile");

  yield* Effect.forkScoped(
    Effect.forever(
      Effect.gen(function* () {
        const message = yield* sub.take;

        const _ = message.path;
        const fileName = yield* Option.fromNullable(
          _.replace(/^.*[\\\/]/, "")
            .replace(/\.[^/.]+$/, "")
            .replace(/(\d+)$/, "")
            .replace("-", ""),
        );
        const [name, ext] = fileName.split(".");

        yield* Effect.logInfo(name, ext);
      }),
    ),
  );
});

export const Parse = {
  Live: Layer.scopedDiscard(make).pipe(Layer.provide(PubSubClient.Live)),
};
