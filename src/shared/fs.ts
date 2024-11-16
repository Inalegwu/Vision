import { Data, Micro } from "effect";
import { Result } from "neverthrow";
import * as fs from "node:fs";

class FSError extends Data.TaggedError("fs-error")<{
  cause: unknown;
}> {}

export namespace Fs {
  export function readFile(path: string) {
    return Result.fromThrowable(
      () => new Uint8Array(fs.readFileSync(path)),
      (error) => `Error reading file ${error}`,
    )();
  }
  export function microReadFile(path: string) {
    return Micro.try({
      try: () => new Uint8Array(fs.readFileSync(path)),
      catch: (error) => new FSError({ cause: error }),
    });
  }
}
