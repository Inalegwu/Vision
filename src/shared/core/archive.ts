import { Fs } from "@shared/fs";
import { issues, metadata, pages } from "@shared/schema";
import db from "@shared/storage";
import {
  convertToImageUrl,
  parseFileNameFromPath,
  sortPages,
} from "@shared/utils";
import Zip from "adm-zip";
import { BroadcastChannel } from "broadcast-channel";
import { Array, Data, Effect, Request, RequestResolver, Schema } from "effect";
import { XMLParser } from "fast-xml-parser";
import { createExtractorFromData } from "node-unrar-js";
import { v4 } from "uuid";
import { MetadataSchema } from "./validations";

type Page = Readonly<{
  name: string;
  data: ArrayBufferLike | undefined;
  isDir: boolean;
}>;

class ArchiveError extends Data.TaggedError("archive-error")<{
  cause: unknown;
}> {}

class SavePageRequest extends Request.TaggedClass("SavePage")<
  {
    id: string;
  },
  ArchiveError,
  Page
> {}

const SavePageResolver = (newIssue: typeof issues.$inferSelect) =>
  RequestResolver.make<SavePageRequest, never>((entries) =>
    Effect.forEach(
      entries.flatMap((entry) => entry),
      (file, index) =>
        Effect.gen(function* () {
          if (file.isDir) {
            return yield* Effect.log("found and skipped directory");
          }

          const pageContent = yield* Effect.sync(() =>
            convertToImageUrl(file.data!),
          );

          yield* Effect.tryPromise(
            async () =>
              await db.insert(pages).values({
                id: v4(),
                pageContent,
                issueId: newIssue.id,
              }),
          );

          parserChannel.postMessage({
            completed: index,
            total: length,
            error: null,
            isCompleted: false,
            state: "SUCCESS",
          });
        }).pipe(Effect.orDie),
    ),
  );

const savePage = (page: Page, newIssue: typeof issues.$inferSelect) =>
  Effect.request(new SavePageRequest(page), SavePageResolver(newIssue));

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");

const createRarExtractor = (path: string) =>
  Effect.gen(function* () {
    const wasmBinary = yield* Fs.readFile(
      require.resolve("node-unrar-js/dist/js/unrar.wasm"),
    ).pipe(Effect.andThen((binary) => binary.buffer));

    return yield* Fs.readFile(path).pipe(
      Effect.map((file) => file.buffer),
      Effect.andThen((data) =>
        Effect.tryPromise(
          async () =>
            await createExtractorFromData({
              data,
              wasmBinary,
            }),
        ),
      ),
      Effect.andThen((extractor) =>
        Effect.try(() =>
          extractor.extract({
            files: [...extractor.getFileList().fileHeaders].map(
              (header) => header.name,
            ),
          }),
        ),
      ),
      Effect.andThen((extracted) =>
        Array.fromIterable(extracted.files)
          .sort((a, b) => sortPages(a.fileHeader.name, b.fileHeader.name))
          .filter((file) => !file.fileHeader.flags.directory),
      ),
    );
  });

const createZipExtractor = (path: string) =>
  Effect.gen(function* () {
    return yield* Fs.readFile(path).pipe(
      Effect.andThen((buff) =>
        new Zip(Buffer.from(buff.buffer))
          .getEntries()
          .sort((a, b) => sortPages(a.name, b.name))
          .map((entry) => ({
            name: entry.name,
            data: entry.getData().buffer,
            isDir: entry.isDirectory,
          }))
          .filter((file) => !file.isDir),
      ),
    );
  });

export class Archive extends Effect.Service<Archive>()("Archive", {
  effect: Effect.gen(function* () {
    const rar = Effect.fn(function* (path: string) {
      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const files = yield* createRarExtractor(path);

      if (files.length === 0) {
        return yield* Effect.sync(() =>
          parserChannel.postMessage({
            error: "File appears to be empty",
            isCompleted: false,
            state: "ERROR",
          }),
        );
      }

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const issueTitle = yield* Effect.sync(() => parseFileNameFromPath(path));

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const _files = files.filter(
        (file) => !file.fileHeader.name.includes("xml"),
      );

      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(
          _files[0]?.extraction?.buffer || _files[1]?.extraction?.buffer!,
        ),
      );

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const newIssue = yield* saveIssue(issueTitle, thumbnailUrl);

      yield* Effect.fork(
        parseXML(
          files.find((file) => file.fileHeader.name.includes("xml"))?.extraction
            ?.buffer,
          newIssue.id,
        ),
      );

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      yield* Effect.forEach(
        _files.map((file) => ({
          name: file.fileHeader.name,
          isDir: file.fileHeader.flags.directory,
          data: file.extraction?.buffer,
        })),
        (page) => savePage(page, newIssue),
        {
          concurrency: _files.length,
        },
      );

      parserChannel.postMessage({
        isCompleted: true,
        error: null,
        state: "SUCCESS",
      });

      yield* Effect.logInfo(`Saved ${issueTitle} File Successfully`);
    });

    const zip = Effect.fn(function* (path: string) {
      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const files = yield* createZipExtractor(path);

      const _files = files.filter((file) => !file.name.includes("xml"));

      const issueTitle = yield* Effect.sync(() => parseFileNameFromPath(path));
      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(_files[0].data || _files[1].data || _files[1].data),
      );

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const newIssue = yield* saveIssue(issueTitle, thumbnailUrl);

      yield* Effect.fork(
        parseXML(
          files.find((file) => file.name.includes("xml"))?.data,
          newIssue.id,
        ),
      );

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      yield* Effect.forEach(_files, (page) => savePage(page, newIssue), {
        concurrency: "unbounded",
      });

      parserChannel.postMessage({
        isCompleted: true,
        error: null,
        state: "SUCCESS",
      });

      yield* Effect.logInfo(`Saved ${issueTitle} File Successfully`);
    });

    return { rar, zip } as const;
  }).pipe(
    Effect.orDie,
    Effect.annotateLogs({
      service: "archive",
    }),
    Effect.withLogSpan("archive.service"),
  ),
}) {}

const parseXML = (buffer: ArrayBufferLike | undefined, issueId: string) =>
  Effect.gen(function* () {
    const xmlParser = new XMLParser();

    if (!buffer) return;

    const file = Buffer.from(buffer).toString();

    const contents = yield* Effect.sync(() => xmlParser.parse(file));

    const comicInfo = yield* Schema.decodeUnknown(MetadataSchema)(
      contents.ComicInfo,
      {
        onExcessProperty: "ignore",
        exact: false,
      },
    );

    yield* Effect.logInfo(comicInfo);

    yield* Effect.tryPromise(
      async () =>
        await db.insert(metadata).values({
          id: v4(),
          issueId,
          ...comicInfo,
        }),
    );
  }).pipe(Effect.orDie, Effect.withLogSpan("parseXML.duration"));

const saveIssue = Effect.fn(function* (
  issueTitle: string,
  thumbnailUrl: string,
) {
  const newIssue = yield* Effect.tryPromise(
    async () =>
      await db
        .insert(issues)
        .values({
          id: v4(),
          issueTitle,
          thumbnailUrl,
        })
        .returning(),
  ).pipe(Effect.map((result) => result.at(0)));

  if (!newIssue) {
    parserChannel.postMessage({
      isCompleted: false,
      error: "Couldn't save Issue",
      state: "ERROR",
    });
    return yield* Effect.die(
      new ArchiveError({ cause: "Unable to Save Issue" }),
    );
  }

  return newIssue;
});
