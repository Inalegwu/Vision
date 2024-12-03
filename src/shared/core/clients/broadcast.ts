import { BroadcastChannel } from "broadcast-channel";
import { Context, Effect, Layer } from "effect";

type IBroadcastClient = Readonly<{
  make: <T>(channelName: string) => Effect.Effect<BroadcastChannel<T>>;
}>;

const make = Effect.gen(function* () {
  const make = <T>(channelName: string) =>
    Effect.succeed(new BroadcastChannel<T>(channelName));

  return { make } satisfies IBroadcastClient;
});

export class BroadcastClient extends Context.Tag("broadcast-client")<
  BroadcastClient,
  IBroadcastClient
>() {
  static live = Layer.effect(this, make);
}
