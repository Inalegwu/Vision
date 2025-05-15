import { Data, Effect } from "effect";
import * as NodeFS from "node:fs";

class FSError extends Data.TaggedError("FSError")<{
  cause: unknown;
}> {}

export namespace Fs {
  export const readFile = (path: string) =>
    Effect.async<Uint8Array<ArrayBuffer>, FSError>((resume) =>
      NodeFS.readFile(path, undefined, (cause, data) => {
        if (cause) {
          resume(Effect.fail(new FSError({ cause })));
        } else {
          resume(Effect.succeed(new Uint8Array(data)));
        }
      }),
    );

  export const writeStream = (fileName: string, data: ArrayBufferLike) =>
    Effect.async<void, FSError>((resume) => {
      const stream = NodeFS.createWriteStream(fileName);

      stream.write(data);

      stream.on("finish", () => resume(Effect.succeed("Write Successful")));

      stream.on("error", (cause) =>
        resume(Effect.fail(new FSError({ cause }))),
      );

      return Effect.sync(() => {
        console.log(`Cleaning up ${fileName}`);
        NodeFS.unlinkSync(fileName);
      });
    });
}
