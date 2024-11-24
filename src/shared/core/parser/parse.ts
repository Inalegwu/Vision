import { issues, pages } from "@src/shared/schema";
import db from "@src/shared/storage";
import { convertToImageUrl } from "@src/shared/utils";
import { Data, Effect, Layer, Match, Option } from "effect";
import { v4 } from "uuid";
import { BroadcastClient } from "../clients/broadcast";
import { RarClient } from "../clients/rar";
import { ZipClient } from "../clients/zip";
import { PubSubClient } from "../pubsub/client";

export class ParserError extends Data.TaggedError("parser-error")<{
  cause: unknown;
}> {}

const make = Effect.gen(function* () {
  const pubsub = yield* PubSubClient;

  const sub = yield* pubsub.subscribeTo("NewFile");

  yield* Effect.forkScoped(
    Effect.forever(
      Effect.gen(function* () {
        const message = yield* sub.take;

        yield* Effect.logInfo(message);

        const _ = message.path;
        const [fileName, ext] = yield* Option.fromNullable(_.split("."));
        const name = yield* Option.fromNullable(
          fileName
            .replace(/^.*[\\\/]/, "")
            .replace(/\.[^/.]+$/, "")
            .replace(/(\d+)$/, "")
            .replace("-", ""),
        );

        yield* Match.value(ext).pipe(
          Match.when("cbr", () => handleRar(message.path, name)),
          Match.when("cbz", () => handleZip(message.path, name)),
          Match.orElse(() => Option.none()),
        );
      }),
    ),
  );
});

export const Parse = {
  Live: Layer.scopedDiscard(make).pipe(Layer.provide(PubSubClient.Live)),
};

function handleRar(path: string, name: string) {
  return Effect.gen(function* () {
    yield* Effect.logInfo(`Recieved RAR @${path} with name ${name}`);

    const broadCastClient = yield* BroadcastClient;
    const rarClient = yield* RarClient;

    const parserBroadcast =
      yield* broadCastClient.make<ParserChannel>("parser-channel");

    yield* Effect.logInfo("Checking if Issue has already been saved");
    const exists = yield* Effect.tryPromise(
      async () =>
        await db.query.issues.findFirst({
          where: (issues, { eq }) => eq(issues.issueTitle, name),
        }),
    );

    if (exists) {
      yield* Effect.logInfo(`${exists.issueTitle} Already Exists`);
      return;
    }

    yield* Effect.logInfo("Extracting Files");
    const files = yield* rarClient.make(path);

    yield* Effect.logInfo("Making New Issues");
    const newIssue = yield* Effect.tryPromise(
      async () =>
        await db
          .insert(issues)
          .values({
            id: v4(),
            issueTitle: name,
            thumbnailUrl: convertToImageUrl(files[0].extraction?.buffer!),
          })
          .returning(),
    );

    yield* Effect.logInfo("Attempting to Save Pages");

    yield* Effect.forEach(
      files,
      (file, idx) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(`Found ${file.fileHeader.name}`);

          yield* Effect.tryPromise(
            async () =>
              await db.insert(pages).values({
                id: v4(),
                issueId: newIssue[0].id,
                pageContent: convertToImageUrl(file.extraction?.buffer!),
              }),
          );

          parserBroadcast.postMessage({
            completed: idx,
            total: files.length,
            error: null,
            isCompleted: idx === files.length,
          });
        }),
      {
        concurrency: "unbounded",
      },
    );
  }).pipe(Effect.provide(RarClient.live), Effect.provide(BroadcastClient.live));
}

function handleZip(path: string, name: string) {
  return Effect.gen(function* () {
    yield* Effect.logInfo(`Recieved ZIP @${path} with name ${name}`);

    const broadCastClient = yield* BroadcastClient;
    const zip = yield* ZipClient;

    const parserBroadcast =
      yield* broadCastClient.make<ParserChannel>("parser-channel");

    const exists = yield* Effect.tryPromise(
      async () =>
        await db.query.issues.findFirst({
          where: (issues, { eq }) => eq(issues.issueTitle, name),
        }),
    );

    if (exists) {
      yield* Effect.logInfo(`${exists.issueTitle} Already Exists`);
      return;
    }

    const files = yield* zip.make(path);

    const newIssue = yield* Effect.tryPromise(
      async () =>
        await db
          .insert(issues)
          .values({
            id: v4(),
            issueTitle: name,
            thumbnailUrl: convertToImageUrl(files[0].getData().buffer),
          })
          .returning(),
    );

    yield* Effect.forEach(files, (file, idx) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`Found ${file.name}`);

        yield* Effect.tryPromise(
          async () =>
            await db.insert(pages).values({
              id: v4(),
              issueId: newIssue[0].id,
              pageContent: convertToImageUrl(file.getData().buffer),
            }),
        );

        parserBroadcast.postMessage({
          completed: idx,
          total: files.length,
          error: null,
          isCompleted: idx === files.length,
        });

        yield* Effect.logInfo("complete");
      }),
    );
  }).pipe(Effect.provide(ZipClient.live));
}
