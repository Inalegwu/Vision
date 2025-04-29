import { Effect } from "effect";
import * as fs from "node:fs";

export namespace Fs {
  export const readFile = (path: string) =>
    Effect.try(() => new Uint8Array(fs.readFileSync(path))).pipe(Effect.orDie);
}
