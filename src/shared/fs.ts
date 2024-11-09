import { Result } from "neverthrow";
import * as fs from "node:fs";

export namespace Fs {
  export function readFile(path: string) {
    return Result.fromThrowable(
      () => new Uint8Array(fs.readFileSync(path)),
      (error) => `Error reading file ${error}`,
    )();
  }
}
