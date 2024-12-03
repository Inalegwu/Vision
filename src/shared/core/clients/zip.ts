import AdmZip from "adm-zip";
import { Context, Data, Effect, Layer } from "effect";

class ZipError extends Data.TaggedError("zip-error")<{
  cause: unknown;
}> {}

type IZipClient = Readonly<{
  make: (path: string) => Effect.Effect<AdmZip.IZipEntry[], ZipError>;
}>;

const make = Effect.gen(function* () {
  const make = (path: string) =>
    Effect.try({
      try: () => new AdmZip(path).getEntries(),
      catch: (cause) => new ZipError({ cause }),
    });

  return { make } satisfies IZipClient;
});

export class ZipClient extends Context.Tag("zip-client")<
  ZipClient,
  IZipClient
>() {
  static live = Layer.effect(this, make);
}
