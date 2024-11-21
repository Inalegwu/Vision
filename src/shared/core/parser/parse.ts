import { Effect, Layer } from "effect";

const make = Effect.gen(function* () {});

export const Parse = {
  Live: Layer.scopedDiscard(make),
};
