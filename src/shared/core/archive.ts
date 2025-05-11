import { issues, metadata, pages } from "@shared/schema";
import db from "@shared/storage";
import {
  convertToImageUrl,
  extractMetaID,
  parseFileNameFromPath,
  sortPages,
} from "@shared/utils";
import Zip from "adm-zip";
import { BroadcastChannel } from "broadcast-channel";
import { Array, Effect, Request, RequestResolver, Schema } from "effect";
import { XMLParser } from "fast-xml-parser";
import { createExtractorFromData } from "node-unrar-js";
import { v4 } from "uuid";
import { Fs } from "../fs";
import { ArchiveError } from "./errors";
import { MetadataSchema } from "./validations";

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");

type Page = Readonly<{
  name: string;
  data: ArrayBufferLike | undefined;
  isDir: boolean;
}>;

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
        }).pipe(Effect.withLogSpan("save-page-request"), Effect.orDie),
    ),
  );

const savePage = (page: Page, newIssue: typeof issues.$inferSelect) =>
  Effect.request(new SavePageRequest(page), SavePageResolver(newIssue));

export class Archive extends Effect.Service<Archive>()("Archive", {
  effect: Effect.gen(function* () {
    const rar = Effect.fn(function* (path: string) {
      yield* Effect.logInfo({ path });
      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const files = yield* createRarExtractor(path);

      if (files.length === 0) {
        parserChannel.postMessage({
          error: "File appears to be empty",
          isCompleted: false,
          state: "ERROR",
        });
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

      const _files = files.filter((file) => !file.name.includes("xml"));

      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(_files[0]?.data || _files[1]?.data!),
      );

      const newIssue = yield* saveIssue(issueTitle, thumbnailUrl);

      yield* Effect.logInfo({ newIssue });

      yield* parseXML(
        files.find((file) => file.name.includes("xml"))?.data,
        newIssue.id,
      ).pipe(Effect.fork);

      yield* Effect.forEach(_files, (page) => savePage(page, newIssue), {
        concurrency: _files.length,
      });

      parserChannel.postMessage({
        isCompleted: true,
        error: null,
        state: "SUCCESS",
      });

      yield* Effect.logInfo(`Saved ${issueTitle} File Successfully`);
    });

    const zip = Effect.fn(function* (path: string) {
      yield* Effect.logInfo({ path });
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

      yield* Effect.logInfo({ newIssue });

      yield* parseXML(
        files.find((file) => file.name.includes("xml"))?.data,
        newIssue.id,
      ).pipe(Effect.fork);

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

const parseXML = Effect.fn(function* (
  buffer: ArrayBufferLike | undefined,
  issueId: string,
) {
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
  const metaID = extractMetaID(comicInfo.Notes || "");

  yield* Effect.logInfo({ ...comicInfo, metaID });

  yield* Effect.tryPromise(
    async () =>
      await db.insert(metadata).values({
        id: v4(),
        issueId,
        ...comicInfo,
      }),
  );
});

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

const createRarExtractor = Effect.fn(function* (path: string) {
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
    Effect.andThen((extracted) =>
      extracted.map((file) => ({
        name: file.fileHeader.name,
        isDir: file.fileHeader.flags.directory,
        data: file.extraction?.buffer,
      })),
    ),
  );
});

const createZipExtractor = Effect.fn(function* (path: string) {
  return yield* Fs.readFile(path).pipe(
    Effect.map((buff) =>
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
