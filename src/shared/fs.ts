import { Data, Effect } from "effect";
import * as fs from "node:fs";

class FSError extends Data.TaggedError("fs-error")<{
  cause: unknown;
}> {}

export namespace Fs {
  export const readFile = (path: string) =>
    Effect.try(() => new Uint8Array(fs.readFileSync(path))).pipe(Effect.orDie);
}
