import { issues, pages } from "@src/shared/schema";
import db from "@src/shared/storage";
import { convertToImageUrl } from "@src/shared/utils";
import { BroadcastChannel } from "broadcast-channel";
import { Effect, Layer } from "effect";
import { v4 } from "uuid";
import { RarClient } from "../../clients/rar";
import { PubSubClient } from "../../pubsub/client";

const existsChannel = new BroadcastChannel<ExistsChannel>("exists-channel");
const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");

const make = Effect.gen(function* () {
  const pubsub = yield* PubSubClient;
  const rarClient = yield* RarClient;

  const queue = yield* pubsub.subscribeTo("NewRarFile");
  const message = yield* queue.take;

  const files = yield* rarClient.make(message.path);

  yield* Effect.logInfo("Made RAR Extractor");

  const exists = yield* Effect.tryPromise(
    async () =>
      await db.query.issues.findFirst({
        where: (issues, { eq }) => eq(issues.issueTitle, message.name),
      }),
  );

  if (exists) {
    existsChannel.postMessage({
      exists: true,
    });
    yield* Effect.logInfo("This issue already exists");
    return;
  }

  const newIssue = yield* Effect.tryPromise(
    async () =>
      await db
        .insert(issues)
        .values({
          id: v4(),
          issueTitle: message.name,
          thumbnailUrl: convertToImageUrl(files[0].extraction?.buffer!),
        })
        .returning(),
  );

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

        yield* Effect.succeed(
          parserChannel.postMessage({
            completed: idx,
            total: files.length,
            isCompleted: true,
            error: null,
          }),
        );
      }),
    {
      concurrency: "unbounded",
    },
  );
});

export const Rar = {
  Live: Layer.scopedDiscard(make).pipe(
    Layer.provide(PubSubClient.Live),
    Layer.provide(RarClient.live),
  ),
};
