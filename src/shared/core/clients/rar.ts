import { sortPages } from "@src/shared/utils";
import { Context, Data, Effect, Layer } from "effect";
import { type ArcFile, createExtractorFromData } from "node-unrar-js";
import * as fs from "node:fs";

class RarClientError extends Data.TaggedError("rar-error")<{
  cause: unknown;
}> {}

type IRarClient = Readonly<{
  make: (
    path: string,
  ) => Effect.Effect<ArcFile<Uint8Array<ArrayBufferLike>>[], RarClientError>;
}>;

const make = Effect.gen(function* () {
  const make = (path: string) =>
    Effect.tryPromise({
      try: async () =>
        await createExtractorFromData({
          data: new Uint8Array(fs.readFileSync(path)).buffer,
          wasmBinary: new Uint8Array(
            fs.readFileSync(
              require.resolve("node_modules/node-unrar-js/dist/js/unrar.wasm"),
            ),
          ).buffer,
        })
          .then((extractor) =>
            extractor.extract({
              files: [...extractor.getFileList().fileHeaders]
                .map((file) => file.name)
                .sort((a, b) => sortPages(a, b))
                .filter((file) => !file.includes("xml")),
            }),
          )
          .then((files) => Array.from(files.files)),
      catch: (cause) => new RarClientError({ cause }),
    });

  return { make } satisfies IRarClient;
});

export class RarClient extends Context.Tag("rar-client")<
  RarClient,
  IRarClient
>() {
  static live = Layer.effect(this, make);
}
