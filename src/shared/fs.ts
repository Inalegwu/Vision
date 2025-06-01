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

  export const makeDirectory = (filePath: string) =>
    Effect.async<void, FSError>((resume) =>
      NodeFS.mkdir(filePath, undefined, (error) => {
        if (error) resume(Effect.fail(new FSError({ cause: error })));

        resume(Effect.void);
      }),
    );

  export const writeFile = (
    path: string,
    data: string | DataView<ArrayBufferLike>,
  ) =>
    Effect.async<void, FSError>((resume) =>
      NodeFS.writeFile(
        path,
        data,
        {
          encoding: "utf-8",
        },
        (error) => {
          if (error) resume(Effect.fail(new FSError({ cause: error })));

          resume(Effect.void);
        },
      ),
    );

  export const writeFileSync = (
    path: string,
    data: string | DataView<ArrayBufferLike>,
    options?: NodeFS.WriteFileOptions,
  ) =>
    Effect.try({
      try: () => NodeFS.writeFileSync(path, data, options),
      catch: (cause) => new FSError({ cause }),
    });

  export const writeStream = (filePath: string, data: ArrayBufferLike) =>
    Effect.async<void, FSError>((resume) => {
      const stream = NodeFS.createWriteStream(filePath);

      stream.write(data);

      stream.on("finish", () => resume(Effect.succeed("Write Successful")));

      stream.on("error", (cause) =>
        resume(Effect.fail(new FSError({ cause }))),
      );

      return Effect.sync(() => {
        console.log(`Cleaning up ${filePath}`);
        NodeFS.unlinkSync(filePath);
      });
    });
}
