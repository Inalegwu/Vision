import { Data, Effect } from "effect";
import * as NodeFS from "node:fs";

class FSError extends Data.TaggedError("FSError")<{
  cause: unknown;
}> {}

export namespace Fs {
  /**
   *
   * @param filePath: string
   * @returns Effect.Effect<void, FSError, never>
   *
   * read contents of a path
   */
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

  /**
   *
   * @param filePath: string
   * @returns Effect.Effect<void, FSError, never>
   *
   * Creates a new directory
   */
  export const makeDirectory = (filePath: string) =>
    Effect.async<void, FSError>((resume) =>
      NodeFS.mkdir(filePath, undefined, (error) => {
        if (error) resume(Effect.fail(new FSError({ cause: error })));

        resume(Effect.void);
      }),
    );

  /**
   *
   * @param path: string
   * @param data: string | DataView<ArrayBufferLike>
   * @param opts: NodeFS.WriteFileOptions
   * @returns Effect.Effect<void, FSError, never>
   *
   * write data to a path
   */
  export const writeFile = (
    path: string,
    data: string | DataView<ArrayBufferLike>,
    opts: NodeFS.WriteFileOptions,
  ) =>
    Effect.async<void, FSError>((resume) =>
      NodeFS.writeFile(path, data, opts, (error) => {
        if (error) resume(Effect.fail(new FSError({ cause: error })));

        resume(Effect.void);
      }),
    );

  /**
   *
   * @param filePath: string
   * @returns Effect.Effect<void, FSError, never>
   *
   * Recursively removes contents of a specified directory
   */
  export const removeDirectory = (filePath: string) =>
    Effect.async<void, FSError>((resume) =>
      NodeFS.rm(
        filePath,
        {
          recursive: true,
        },
        (error) => {
          if (error) resume(Effect.fail(new FSError({ cause: error })));

          resume(Effect.void);
        },
      ),
    );

  /**
   *
   * @param filePath: string
   * @param data: ArrayBufferLike
   * @returns Effect.Effect<void, FSError, never>
   *
   * creates a writeable stream to output data
   */
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
