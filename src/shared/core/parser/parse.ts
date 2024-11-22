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
        const ext = yield* Option.fromNullable(_.split(".")[1]);
        const fileName = yield* Option.fromNullable(
          _.replace(/^.*[\\\/]/, "")
            .replace(/\.[^/.]+$/, "")
            .replace(/(\d+)$/, "")
            .replace("-", ""),
        );

        yield* Effect.logInfo(ext, fileName);
      }),
    ),
  );
});

export const Parse = {
  Live: Layer.scopedDiscard(make).pipe(Layer.provide(PubSubClient.Live)),
};
