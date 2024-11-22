import { Effect, Layer } from "effect";
import { ZipClient } from "../../clients/zip";
import { PubSubClient } from "../../pubsub/client";

const make = Effect.gen(function* () {
  const pubsub = yield* PubSubClient;
  const zipClient = yield* ZipClient;
  const queue = yield* pubsub.subscribeTo("NewZipFile");

  const message = yield* queue.take;

  const entries = yield* zipClient.make(message.path);

  yield* Effect.forEach(
    entries,
    (entry) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(entry.name);
      }),
    {
      concurrency: "unbounded",
    },
  );
});

export const Zip = {
  Live: Layer.scopedDiscard(make).pipe(
    Layer.provide(ZipClient.live),
    Layer.provide(PubSubClient.Live),
  ),
};
