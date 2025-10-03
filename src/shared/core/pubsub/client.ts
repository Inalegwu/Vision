import { Context, Effect, Layer, PubSub } from "effect";
import type { Dequeue } from "effect/Queue";
import type { Scope } from "effect/Scope";

type IWatcherSub = Readonly<{
  subscribe: () => Effect.Effect<
    Dequeue<{
      filePath: string;
    }>,
    never,
    Scope
  >;
  publish: (message: {
    filePath: string;
  }) => Effect.Effect<void>;
}>;

const make = Effect.gen(function* () {
  const pubSub = yield* PubSub.unbounded<{
    filePath: string;
  }>();

  return WatcherSub.of({
    publish: (message) => PubSub.publish(pubSub, message),
    subscribe: () => PubSub.subscribe(pubSub),
  });
});

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class WatcherSub extends Context.Tag("WatcherSub")<
  WatcherSub,
  IWatcherSub
>() {
  static default = Layer.scopedDiscard(make);
}
