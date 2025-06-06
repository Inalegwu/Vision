import { issues, metadata } from "@shared/schema";
import db from "@shared/storage";
import {
  convertToImageUrl,
  extractMetaID,
  parseFileNameFromPath,
  sortPages,
} from "@shared/utils";
import Zip from "adm-zip";
import { BroadcastChannel } from "broadcast-channel";
import { Option } from "effect";
import * as Array from "effect/Array";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { XMLParser } from "fast-xml-parser";
import { createExtractorFromData } from "node-unrar-js";
import path from "node:path";
import { v4 } from "uuid";
import { Fs } from "../fs";
import { ArchiveError } from "./errors";
import { MetadataSchema } from "./validations";

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");

export class Archive extends Effect.Service<Archive>()("Archive", {
  effect: Effect.gen(function* () {
    /**
     *
     * Extracts .CBR files to a predefined cache directory
     * and saves metadata to a local database for easy retrieval
     * aimed at improving app performance as well as reduce
     * storage consumption
     *
     */
    const rar = Effect.fnUntraced(function* (filePath: string) {
      // has xml file
      const _files = yield* createRarExtractor(filePath).pipe(
        Effect.map((files) => files.filter((file) => !file.isDir)),
      );

      // doesn't have xml file
      const files = _files.filter((file) => !file.name.includes(".xml"));

      const issueTitle = yield* Effect.sync(() =>
        parseFileNameFromPath(filePath),
      );

      const savePath = path.join(process.env.cache_dir!, issueTitle);

      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(files[0].data || files[1].data || files[1].data!),
      );

      const newIssue = yield* saveIssue(issueTitle, thumbnailUrl, savePath);

      yield* parseXML(
        _files.find((file) => file.name.includes(".xml"))?.data,
        newIssue.id,
      ).pipe(Effect.fork);

      yield* Fs.makeDirectory(savePath).pipe(Effect.catchAll(Effect.logFatal));

      yield* Effect.forEach(_files, (file) =>
        Fs.writeFileSync(
          path.join(savePath, file.name),
          Buffer.from(file.data!).toString("base64"),
          {
            encoding: "base64",
          },
        ),
      );
    });

    /**
     *
     * Extracts .CBZ files to a predefined cache directory
     * and saves metadata to a local database for easy retrieval
     * aimed at improving app performance as well as reduce
     * storage consumption
     *
     */
    const zip = Effect.fnUntraced(function* (filePath: string) {
      const _files = yield* createZipExtractor(filePath);

      const issueTitle = yield* Effect.sync(() =>
        parseFileNameFromPath(filePath),
      );

      const savePath = path.join(process.env.cache_dir!, issueTitle);

      // doesn't have .xml file
      const files = _files.filter((file) => !file.name.includes(".xml"));

      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(files[0].data || files[1].data || files[2].data),
      );

      const newIssue = yield* saveIssue(issueTitle, thumbnailUrl, savePath);

      yield* parseXML(
        _files.find((file) => file.name.includes(".xml"))?.data,
        newIssue.id,
      ).pipe(Effect.fork);

      yield* Fs.makeDirectory(savePath).pipe(Effect.catchAll(Effect.logFatal));

      yield* Effect.forEach(_files, (file) =>
        Fs.writeFileSync(
          path.join(savePath, file.name),
          Buffer.from(file.data!).toString("base64"),
          {
            encoding: "base64",
          },
        ),
      );
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

  const { metadata: parsedMeta, metaId } = yield* Effect.sync(() =>
    xmlParser.parse(Buffer.from(buffer).toString()),
  ).pipe(
    Effect.andThen((file) =>
      Schema.decodeUnknown(MetadataSchema)(file.comicInfo, {
        exact: false,
        onExcessProperty: "ignore",
      }),
    ),
    Effect.map((metadata) => ({
      metadata,
      metaId: extractMetaID(metadata.Notes).pipe(Option.getOrNull),
    })),
  );

  yield* Effect.logInfo({ metaId });

  yield* Effect.tryPromise(
    async () =>
      await db.insert(metadata).values({
        id: v4(),
        issueId,
        ...parsedMeta,
      }),
  );
});

const saveIssue = Effect.fn(function* (
  issueTitle: string,
  thumbnailUrl: string,
  path: string,
) {
  const newIssue = yield* Effect.tryPromise(
    async () =>
      await db
        .insert(issues)
        .values({
          id: v4(),
          issueTitle,
          thumbnailUrl,
          path,
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

const createRarExtractor = Effect.fn(function* (filePath: string) {
  const wasmBinary = yield* Fs.readFile(
    require.resolve("node-unrar-js/dist/js/unrar.wasm"),
  ).pipe(Effect.andThen((binary) => binary.buffer));

  return yield* Fs.readFile(filePath).pipe(
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

const createZipExtractor = Effect.fn(function* (filePath: string) {
  return yield* Fs.readFile(filePath).pipe(
    Effect.map((buff) => new Zip(Buffer.from(buff.buffer))),
    Effect.map((zip) =>
      zip
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
