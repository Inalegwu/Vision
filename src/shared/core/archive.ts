import { issues, metadata } from "@shared/schema";
import db from "@shared/storage";
import {
  convertToImageUrl,
  extractMetaID,
  parseFileNameFromPath,
  sortPages,
} from "@shared/utils";
import Zip from "adm-zip";
import { Option } from "effect";
import * as Array from "effect/Array";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { XMLParser } from "fast-xml-parser";
import { createExtractorFromData } from "node-unrar-js";
import path from "node:path";
import { v4 } from "uuid";
import { parserChannel } from "../channels";
import { Fs } from "../fs";
import { MetadataSchema } from "../validations";
import { Dump } from "./utils/dump";
import { ArchiveError } from "./utils/errors";

export class Archive extends Effect.Service<Archive>()("Archive", {
  dependencies: [Dump.Default],
  effect: Effect.gen(function* () {
    const dump = yield* Dump;

    /**
     *
     * Extracts .CBR files to a predefined cache directory
     * and saves metadata to a local database for easy retrieval
     * aimed at improving app performance as well as reduce
     * storage consumption
     *
     */
    const rar = Effect.fnUntraced(function* (filePath: string) {
      const { files, meta } = yield* createRarExtractor(filePath);

      const issueTitle = yield* Effect.sync(() =>
        parseFileNameFromPath(filePath),
      );

      const savePath = path.join(process.env.cache_dir!, issueTitle);

      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(files[0].data || files[1].data || files[1].data!),
      );

      const newIssue = yield* saveIssue(issueTitle, thumbnailUrl, savePath);

      yield* parseXML(meta, newIssue.id).pipe(
        Effect.fork,
        Effect.catchAll(Effect.logFatal),
      );

      yield* Fs.makeDirectory(savePath).pipe(
        Effect.catchTag("FSError", (e) =>
          Effect.gen(function* () {
            yield* Effect.logFatal(e.message);
            yield* dump.writeToDump({
              id: v4(),
              error: String(e.message),
              date: new Date(),
            });
          }),
        ),
      );

      yield* Effect.forEach(files, (file) =>
        Fs.writeFile(
          path.join(savePath, file.name),
          Buffer.from(file.data!).toString("base64"),
          {
            encoding: "base64",
          },
        ).pipe(Effect.catchTag("FSError", (e) => Effect.logFatal(e.message))),
      );

      yield* Effect.sync(() =>
        parserChannel.postMessage({
          state: "SUCCESS",
          isCompleted: true,
          error: null,
        }),
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
      const { files, meta } = yield* createZipExtractor(filePath);

      const issueTitle = yield* Effect.sync(() =>
        parseFileNameFromPath(filePath),
      );

      const savePath = path.join(process.env.cache_dir!, issueTitle);

      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(files[0].data || files[1].data || files[2].data),
      );

      const newIssue = yield* saveIssue(issueTitle, thumbnailUrl, savePath);

      yield* parseXML(meta, newIssue.id).pipe(
        Effect.fork,
        Effect.catchAll(Effect.logFatal),
      );

      yield* Fs.makeDirectory(savePath).pipe(
        Effect.catchTag("FSError", (e) => Effect.log(e)),
      );

      yield* Effect.forEach(files, (file, idx) =>
        Fs.writeFile(
          path.join(savePath, file.name),
          Buffer.from(file.data!).toString("base64"),
          {
            encoding: "base64",
          },
        ).pipe(
          Effect.catchTag("FSError", (e) =>
            Effect.logFatal(`${e.cause}::${e.message}`),
          ),
        ),
      );

      yield* Effect.sync(() =>
        parserChannel.postMessage({
          state: "SUCCESS",
          isCompleted: true,
          error: null,
        }),
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
  file: Option.Option<Extractor>,
  issueId: string,
) {
  const xmlParser = new XMLParser();

  const data = Option.getOrUndefined(file);

  if (!data) return;

  const { metadata: meta, metaId } = yield* Effect.sync(() =>
    xmlParser.parse(Buffer.from(data.data!).toString()),
  ).pipe(
    Effect.andThen((file) =>
      Schema.decodeUnknown(MetadataSchema)(file.comicInfo, {
        onExcessProperty: "ignore",
        exact: false,
      }),
    ),
    Effect.map((metadata) => ({
      metadata,
      metaId: extractMetaID(metadata.Notes).pipe(Option.getOrUndefined),
    })),
  );

  yield* Effect.logInfo({ meta });

  yield* Effect.tryPromise(
    async () =>
      await db.insert(metadata).values({
        id: v4(),
        issueId,
        ...meta,
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
      isCompleted: true,
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
    Effect.map((extracted) =>
      Array.fromIterable(extracted.files)
        .sort((a, b) => sortPages(a.fileHeader.name, b.fileHeader.name))
        .filter((file) => !file.fileHeader.flags.directory),
    ),
    Effect.andThen((extracted) =>
      extracted.map(
        (file) =>
          ({
            name: file.fileHeader.name,
            isDir: file.fileHeader.flags.directory,
            data: file.extraction?.buffer,
          }) satisfies Extractor,
      ),
    ),
    Effect.map((files) => ({
      meta: Option.fromNullable(
        files.find((file) => file.name.includes(".xml")),
      ),
      files: files
        .filter((file) => !file.name.includes(".xml"))
        .filter((file) => !file.isDir),
    })),
  );
});

const createZipExtractor = (filePath: string) =>
  Fs.readFile(filePath).pipe(
    Effect.map((buff) => new Zip(Buffer.from(buff.buffer))),
    Effect.map((zip) =>
      zip
        .getEntries()
        .sort((a, b) => sortPages(a.name, b.name))
        .map(
          (entry) =>
            ({
              name: entry.name,
              data: entry.getData().buffer,
              isDir: entry.isDirectory,
            }) satisfies Extractor,
        ),
    ),
    Effect.map((files) => ({
      meta: Option.fromNullable(
        files.find((file) => file.name.includes(".xml")),
      ),
      files: files
        .filter((file) => !file.name.includes(".xmk"))
        .filter((file) => !file.isDir),
    })),
  );
