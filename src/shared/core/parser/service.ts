import { Effect, Layer } from "effect";
import { BroadcastClient } from "../clients/broadcast";
import { Parse } from "./parse";

const make = Effect.gen(function* () {
  yield* Effect.logInfo("Starting Parser Service");

  yield* Effect.acquireRelease(Effect.logInfo("Started Parser Service"), () =>
    Effect.logInfo("Stopped Parser Service"),
  );
});

export const ParserService = Layer.scopedDiscard(make).pipe(
  Layer.provide(Parse.Live),
  Layer.provide(BroadcastClient.live),
);
